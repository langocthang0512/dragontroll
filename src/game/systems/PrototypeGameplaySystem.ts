import { GAMEPLAY_CONFIG } from "../../config/gameplay";
import { CameraSystem } from "../camera/CameraSystem";
import { CheckpointSystem } from "../checkpoints/CheckpointSystem";
import type { Player } from "../entities/Player";
import { createPlayer } from "../entities/Player";
import type { LevelSection, PrototypeArea } from "../gameplay/types";
import type { InputSystem } from "../input/InputSystem";
import { createMap1 } from "../maps/map1";
import { expanded, intersects } from "../physics/collision";
import type { RunSave, SaveManager } from "../save/SaveManager";
import type { GameStateManager } from "../state/GameStateManager";
import { CombatSystem } from "./CombatSystem";
import { EnemySystem } from "./EnemySystem";
import { FallingHazardSystem } from "./FallingHazardSystem";
import { GoldSystem } from "./GoldSystem";
import { LivesSystem } from "./LivesSystem";
import { PlayerMovementSystem } from "./PlayerMovementSystem";
import { RespawnSystem } from "./RespawnSystem";

export interface GameplayFrameEvents {
  attackStarted: boolean;
  attackHit: boolean;
  landed: boolean;
  deathStarted: boolean;
  checkpointActivated: boolean;
  goldCollected: boolean;
  enemyDefeated: boolean;
  gameOver: boolean;
  victory: boolean;
}

export type LifePurchaseResult = "purchased" | "max-lives" | "insufficient-gold";

const EMPTY_EVENTS: GameplayFrameEvents = {
  attackStarted: false,
  attackHit: false,
  landed: false,
  deathStarted: false,
  checkpointActivated: false,
  goldCollected: false,
  enemyDefeated: false,
  gameOver: false,
  victory: false,
};

export class PrototypeGameplaySystem {
  readonly player: Player = createPlayer();
  readonly camera: CameraSystem;
  readonly combat = new CombatSystem();
  readonly checkpoints = new CheckpointSystem();
  readonly lives = new LivesSystem();
  readonly gold = new GoldSystem();
  readonly respawn = new RespawnSystem();
  readonly movement = new PlayerMovementSystem();
  readonly enemies = new EnemySystem();
  readonly hazards = new FallingHazardSystem();
  area: PrototypeArea = createMap1();
  checkpointPulse = 0;
  landingPulse = 0;
  private frameEvents: GameplayFrameEvents = { ...EMPTY_EVENTS };

  constructor(
    private readonly input: InputSystem,
    private readonly state: GameStateManager,
    private readonly saves: SaveManager,
    viewportWidth: number,
  ) {
    this.camera = new CameraSystem(viewportWidth);
    this.restoreSavedRun();
  }

  get canResume(): boolean {
    return this.lives.lives > 0;
  }

  get currentSection(): LevelSection {
    const center = this.player.x + this.player.w / 2;
    return this.area.sections.find((section) => center >= section.startX && center < section.endX)
      ?? this.area.sections[this.area.sections.length - 1]!;
  }

  startOrResume(): boolean {
    if (!this.canResume) return false;
    this.placeAtRespawn();
    this.resetThreats();
    this.respawn.startPlay();
    this.syncState("ENTER THE LOST WORLD");
    return true;
  }

  update(deltaSeconds: number): GameplayFrameEvents {
    this.resetFrameEvents();
    this.checkpointPulse = Math.max(0, this.checkpointPulse - deltaSeconds);
    this.landingPulse = Math.max(0, this.landingPulse - deltaSeconds);

    if (this.respawn.state === "play") this.updatePlay(deltaSeconds);
    else this.updateRespawn(deltaSeconds);

    this.camera.follow(this.player.x + this.player.w / 2, this.area.width, deltaSeconds, 0.42);
    if (this.state.snapshot.runFlow !== this.respawn.state) this.state.patch({ runFlow: this.respawn.state });
    return this.frameEvents;
  }

  applyDamage(reason: string): boolean {
    const result = this.lives.damage();
    if (!this.respawn.beginDeath(result.gameOver)) {
      this.lives.restore(result.remainingLives + 1);
      return false;
    }
    this.combat.interrupt();
    this.player.vx = 0;
    this.player.vy = 0;
    this.frameEvents.deathStarted = true;
    this.state.patch({
      lives: result.remainingLives,
      deaths: this.state.snapshot.deaths + 1,
      message: reason,
      runFlow: "dying",
    });
    this.persistRun();
    return true;
  }

  purchaseLife(): LifePurchaseResult {
    if (this.lives.lives >= GAMEPLAY_CONFIG.maxLives) return "max-lives";
    if (!this.gold.spend(GAMEPLAY_CONFIG.shopLifePrice)) return "insufficient-gold";
    this.lives.addLife();
    this.persistRun();
    this.syncState("LIFE PURCHASED");
    return "purchased";
  }

  restartFromCheckpoint(): void {
    this.placeAtRespawn();
    this.combat.interrupt();
    this.movement.reset();
    this.resetThreats();
    this.respawn.startPlay();
    this.syncState("RESTARTED AT CHECKPOINT");
  }

  restartRun(): void {
    const wallet = this.gold.gold;
    this.area = createMap1();
    this.lives.reset();
    this.gold.restore(wallet, [], this.area.gold);
    this.checkpoints.reset(this.area.spawn);
    this.placeAtRespawn();
    this.combat.interrupt();
    this.movement.reset();
    this.resetThreats();
    this.respawn.startPlay();
    this.persistRun();
    this.state.patch({ levelCleared: false });
    this.syncState("NEW LOST WORLD RUN");
  }

  private updatePlay(deltaSeconds: number): void {
    const horizontal = this.input.actionDown("left") ? -1 : this.input.actionDown("right") ? 1 : 0;
    const movement = this.movement.update(this.player, {
      horizontal,
      jumpPressed: this.input.consumeAction("jump"),
      jumpHeld: this.input.actionDown("jump"),
    }, this.area.platforms, deltaSeconds);
    this.frameEvents.landed = movement.landed;
    if (movement.landed) this.landingPulse = 0.14;

    if (this.input.consumeAction("attack") && this.combat.requestAttack()) this.frameEvents.attackStarted = true;
    const combatResult = this.combat.update(deltaSeconds, this.player, this.area.enemies);
    this.frameEvents.attackHit = combatResult.hit;
    if (combatResult.hitTargetId && this.enemies.defeat(this.area.enemies, combatResult.hitTargetId)) {
      this.frameEvents.enemyDefeated = true;
      this.state.patch({ message: "MOSS DRAKE DEFEATED" });
    }

    const enemyDamage = this.enemies.update(this.area.enemies, this.player, deltaSeconds);
    if (enemyDamage) {
      this.applyDamage(enemyDamage);
      return;
    }
    const hazardDamage = this.hazards.update(this.area.hazards, this.player, deltaSeconds);
    if (hazardDamage) {
      this.applyDamage(hazardDamage);
      return;
    }

    const gained = this.gold.collect(this.player, this.area.gold);
    if (gained > 0) {
      this.frameEvents.goldCollected = true;
      this.state.patch({ gold: this.gold.gold, message: `GOLD +${gained}` });
      this.persistRun();
    }

    for (const checkpoint of this.area.checkpoints) {
      if (!intersects(this.player, expanded(checkpoint, 2))) continue;
      const changed = this.checkpoints.activate({
        id: checkpoint.id,
        areaId: this.area.id,
        x: checkpoint.x + checkpoint.w / 2 - this.player.w / 2,
        y: checkpoint.y - this.player.h,
      });
      if (changed) {
        this.checkpointPulse = 0.8;
        this.frameEvents.checkpointActivated = true;
        this.state.patch({ message: "ANCIENT DOOR AWAKENED" });
        this.persistRun();
      }
    }

    this.player.x = Math.max(0, Math.min(this.area.width - this.player.w, this.player.x));
    if (this.player.y > this.area.voidY) {
      this.applyDamage("LOST TO THE DEPTHS  LIFE LOST");
      return;
    }
    if (intersects(this.player, this.area.goal)) this.completeLevel();
  }

  private completeLevel(): void {
    this.saves.addUnlock("map-2-placeholder");
    this.persistRun();
    this.frameEvents.victory = true;
    this.state.patch({
      mode: "victory",
      levelCleared: true,
      message: "LOST WORLD CLEARED",
    });
  }

  private updateRespawn(deltaSeconds: number): void {
    const event = this.respawn.update(deltaSeconds);
    if (event === "respawn") {
      this.placeAtRespawn();
      this.resetThreats();
      this.syncState("RESPAWNED AT ANCIENT DOOR");
    }
    if (event === "gameOver") {
      this.frameEvents.gameOver = true;
      this.state.patch({ mode: "gameOver", runFlow: "gameOver", message: "RUN OVER" });
    }
  }

  private restoreSavedRun(): void {
    const run = this.saves.snapshot.run;
    this.lives.restore(run.lives);
    this.gold.restore(run.gold, run.collectedGoldIds, this.area.gold);
    const savedCheckpoint = run.checkpoint?.areaId === this.area.id
      ? this.resolveCheckpoint(run.checkpoint.checkpointId)
      : undefined;
    this.checkpoints.hydrate(savedCheckpoint, this.area.spawn);
    this.placeAtRespawn();
    this.resetThreats();
    this.syncState(this.canResume ? "MAP 1 READY" : "RUN OVER");
  }

  private resolveCheckpoint(checkpointId: string) {
    const checkpoint = this.area.checkpoints.find((item) => item.id === checkpointId);
    if (!checkpoint) return undefined;
    return {
      id: checkpoint.id,
      areaId: this.area.id,
      x: checkpoint.x + checkpoint.w / 2 - this.player.w / 2,
      y: checkpoint.y - this.player.h,
    };
  }

  private placeAtRespawn(): void {
    const spawn = this.checkpoints.restore();
    Object.assign(this.player, {
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      ground: false,
      wasGrounded: false,
    });
    this.camera.snapTo(this.player.x, this.area.width, 0.42);
  }

  private resetThreats(): void {
    this.enemies.reset(this.area.enemies);
    this.hazards.reset(this.area.hazards);
  }

  private persistRun(): void {
    const active = this.checkpoints.active;
    const run: RunSave = {
      lives: this.lives.lives,
      gold: this.gold.gold,
      collectedGoldIds: this.gold.collected,
      ...(active ? { checkpoint: { areaId: active.areaId, checkpointId: active.id } } : {}),
    };
    this.saves.saveRun(run);
  }

  private syncState(message: string): void {
    this.state.patch({
      lives: this.lives.lives,
      gold: this.gold.gold,
      runFlow: this.respawn.state,
      message,
    });
  }

  private resetFrameEvents(): void {
    this.frameEvents.attackStarted = false;
    this.frameEvents.attackHit = false;
    this.frameEvents.landed = false;
    this.frameEvents.deathStarted = false;
    this.frameEvents.checkpointActivated = false;
    this.frameEvents.goldCollected = false;
    this.frameEvents.enemyDefeated = false;
    this.frameEvents.gameOver = false;
    this.frameEvents.victory = false;
  }
}
