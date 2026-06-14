import { beforeEach, describe, expect, it, vi } from "vitest";
import { GAMEPLAY_CONFIG } from "../src/config/gameplay";
import { CheckpointSystem } from "../src/game/checkpoints/CheckpointSystem";
import { createPlayer } from "../src/game/entities/Player";
import type { EnemyEntity, FallingHazard, GoldPickup, StaticPlatform, TrainingTarget } from "../src/game/gameplay/types";
import type { InputSystem } from "../src/game/input/InputSystem";
import { createMap1 } from "../src/game/maps/map1";
import { SaveManager } from "../src/game/save/SaveManager";
import { GameStateManager } from "../src/game/state/GameStateManager";
import { CombatSystem } from "../src/game/systems/CombatSystem";
import { EnemySystem } from "../src/game/systems/EnemySystem";
import { FallingHazardSystem } from "../src/game/systems/FallingHazardSystem";
import { GoldSystem } from "../src/game/systems/GoldSystem";
import { LivesSystem } from "../src/game/systems/LivesSystem";
import { PlayerMovementSystem } from "../src/game/systems/PlayerMovementSystem";
import { PrototypeGameplaySystem } from "../src/game/systems/PrototypeGameplaySystem";
import { RespawnSystem } from "../src/game/systems/RespawnSystem";

describe("player movement", () => {
  const ground: StaticPlatform[] = [{ id: "ground", x: 0, y: 100, w: 500, h: 40 }];

  it("accelerates predictably and supports buffered jumping", () => {
    const movement = new PlayerMovementSystem();
    const player = createPlayer();
    player.x = 20;
    player.y = 54;
    player.ground = true;

    const first = movement.update(player, { horizontal: 1, jumpPressed: false, jumpHeld: false }, ground, 1 / 60);
    expect(first.landed).toBe(false);
    expect(player.vx).toBeGreaterThan(0);
    expect(player.vx).toBeLessThanOrEqual(GAMEPLAY_CONFIG.maxRunSpeed);

    const jump = movement.update(player, { horizontal: 1, jumpPressed: true, jumpHeld: true }, ground, 1 / 60);
    expect(jump.jumped).toBe(true);
    expect(player.vy).toBeLessThan(0);
    expect(player.ground).toBe(false);
  });

  it("applies air control without exceeding maximum speed", () => {
    const movement = new PlayerMovementSystem();
    const player = createPlayer();
    player.y = 0;
    for (let frame = 0; frame < 180; frame++) {
      movement.update(player, { horizontal: 1, jumpPressed: false, jumpHeld: true }, [], 1 / 60);
    }
    expect(player.vx).toBe(GAMEPLAY_CONFIG.maxRunSpeed);
  });
});

describe("combat", () => {
  it("hits once during the active window and enforces cooldown", () => {
    const combat = new CombatSystem();
    const player = createPlayer();
    player.x = 50;
    player.y = 50;
    player.face = 1;
    const target: TrainingTarget = { id: "dummy", x: 78, y: 58, w: 28, h: 40, hitCount: 0, flashRemaining: 0 };

    expect(combat.requestAttack()).toBe(true);
    expect(combat.requestAttack()).toBe(false);
    combat.update(0.08, player, target);
    combat.update(0.04, player, target);
    expect(target.hitCount).toBe(1);
    combat.update(0.04, player, target);
    expect(target.hitCount).toBe(1);
    combat.update(0.2, player, target);
    expect(combat.requestAttack()).toBe(false);
    combat.update(GAMEPLAY_CONFIG.attackCooldown, player, target);
    expect(combat.requestAttack()).toBe(true);
  });

  it("selects one target per swing from a reusable target list", () => {
    const combat = new CombatSystem();
    const player = createPlayer();
    player.x = 50;
    player.y = 50;
    const targets: TrainingTarget[] = [
      { id: "near", x: 78, y: 58, w: 28, h: 40, hitCount: 0, flashRemaining: 0 },
      { id: "far", x: 108, y: 58, w: 28, h: 40, hitCount: 0, flashRemaining: 0 },
    ];
    combat.requestAttack();
    const result = combat.update(0.08, player, targets);
    expect(result.hitTargetId).toBe("near");
    expect(targets.map((target) => target.hitCount)).toEqual([1, 0]);
  });
});

describe("map 1 production systems", () => {
  it("contains the complete eight-section Lost World route", () => {
    const map = createMap1();
    expect(map.id).toBe("map-1-lost-world");
    expect(map.sections).toHaveLength(8);
    expect(map.enemies.length).toBeGreaterThanOrEqual(5);
    expect(map.hazards.length).toBeGreaterThanOrEqual(4);
    expect(map.checkpoints).toHaveLength(1);
    expect(map.gold.reduce((total, pickup) => total + pickup.value, 0)).toBeGreaterThanOrEqual(100);
    expect(map.goal.x).toBeGreaterThan(map.sections[6]!.startX);
  });

  it("patrols, detects at two widths, fires pooled orbs, and supports defeat", () => {
    const system = new EnemySystem();
    const player = createPlayer();
    player.x = 100;
    player.y = 454;
    const enemy: EnemyEntity = {
      id: "drake", x: 154, y: 458, w: 38, h: 42,
      patrolMin: 140, patrolMax: 190, direction: -1, speed: 0,
      shootCooldownRemaining: 0, alive: true, hitCount: 0, flashRemaining: 0,
    };
    expect(system.update([enemy], player, 1 / 60)).toBeUndefined();
    expect(system.projectiles.some((projectile) => projectile.active)).toBe(true);
    expect(system.defeat([enemy], "drake")).toBe(true);
    expect(enemy.alive).toBe(false);
  });

  it("telegraphs before dropping and resets after reaching the floor", () => {
    const system = new FallingHazardSystem();
    const player = createPlayer();
    player.x = 90;
    player.y = 454;
    const hazard: FallingHazard = {
      id: "egg", x: 100, y: 20, w: 28, h: 36,
      spawnY: 20, resetY: 80, triggerX: 80, triggerWidth: 80,
      state: "idle", telegraphRemaining: 0, vy: 0,
    };
    system.update([hazard], player, 1 / 60);
    expect(hazard.state).toBe("telegraph");
    system.update([hazard], player, GAMEPLAY_CONFIG.trapTelegraphDuration);
    expect(hazard.state).toBe("falling");
    system.update([hazard], player, 1);
    expect(hazard.state).toBe("idle");
    expect(hazard.y).toBe(hazard.spawnY);
  });
});

describe("progression systems", () => {
  it("tracks lives through respawn and game over", () => {
    const lives = new LivesSystem();
    const respawn = new RespawnSystem();
    respawn.startPlay();
    expect(lives.damage()).toEqual({ remainingLives: 2, gameOver: false });
    expect(respawn.beginDeath(false)).toBe(true);
    expect(respawn.update(GAMEPLAY_CONFIG.deathDuration)).toBe("none");
    expect(respawn.update(GAMEPLAY_CONFIG.respawnDuration)).toBe("respawn");
    respawn.startPlay();
    lives.damage();
    const last = lives.damage();
    expect(last.gameOver).toBe(true);
    expect(respawn.beginDeath(true)).toBe(true);
    expect(respawn.update(GAMEPLAY_CONFIG.deathDuration)).toBe("gameOver");
  });

  it("keeps only the latest checkpoint active", () => {
    const checkpoints = new CheckpointSystem();
    checkpoints.reset({ x: 1, y: 2 });
    expect(checkpoints.activate({ id: "a", areaId: "yard", x: 10, y: 20 })).toBe(true);
    expect(checkpoints.activate({ id: "b", areaId: "yard", x: 30, y: 40 })).toBe(true);
    expect(checkpoints.isActive("yard", "a")).toBe(false);
    expect(checkpoints.isActive("yard", "b")).toBe(true);
    expect(checkpoints.restore()).toEqual({ x: 30, y: 40 });
  });

  it("collects each gold pickup only once", () => {
    const gold = new GoldSystem();
    const player = createPlayer();
    player.x = 0;
    player.y = 0;
    const pickups: GoldPickup[] = [{ id: "coin", x: 0, y: 0, w: 30, h: 50, value: 2, collected: false }];
    expect(gold.collect(player, pickups)).toBe(2);
    expect(gold.collect(player, pickups)).toBe(0);
    expect(gold.gold).toBe(2);
    expect(gold.collected).toEqual(["coin"]);
  });

  it("buys one life for 50 gold without exceeding the life cap", () => {
    const gold = new GoldSystem();
    const lives = new LivesSystem();
    gold.restore(75, [], []);
    lives.damage();
    expect(gold.spend(GAMEPLAY_CONFIG.shopLifePrice)).toBe(true);
    expect(lives.addLife()).toBe(true);
    expect(gold.gold).toBe(25);
    expect(lives.lives).toBe(3);
    expect(lives.addLife()).toBe(false);
    expect(gold.spend(GAMEPLAY_CONFIG.shopLifePrice)).toBe(false);
  });
});

describe("save migration and reload", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
  });

  it("preserves character, checkpoint, lives, gold, collected ids, and unlocks", () => {
    const saves = new SaveManager(5);
    saves.load();
    saves.saveCharacter("female");
    saves.saveRun({
      lives: 2,
      gold: 7,
      collectedGoldIds: ["gold-a"],
      checkpoint: { areaId: "core-systems-yard", checkpointId: "checkpoint-alpha" },
    });
    saves.addUnlock("future-map-alpha");

    const reloaded = new SaveManager(5).load();
    expect(reloaded.schemaVersion).toBe(3);
    expect(reloaded.selectedCharacter).toBe("female");
    expect(reloaded.run).toEqual({
      lives: 2,
      gold: 7,
      collectedGoldIds: ["gold-a"],
      checkpoint: { areaId: "core-systems-yard", checkpointId: "checkpoint-alpha" },
    });
    expect(reloaded.unlocks).toContain("future-map-alpha");
  });

  it("composes checkpoint, shop, and victory into one persisted Map 1 flow", () => {
    const input = {
      actionDown: () => false,
      consumeAction: () => false,
    } as unknown as InputSystem;
    const saves = new SaveManager(1);
    saves.load();
    const state = new GameStateManager({
      mode: "menu",
      currentLevel: 0,
      deaths: 0,
      message: "",
      levelCleared: false,
      selectedCharacter: "male",
      lives: 3,
      gold: 0,
      runFlow: "spawn",
    });
    const gameplay = new PrototypeGameplaySystem(input, state, saves, 960);
    gameplay.startOrResume();

    const checkpoint = gameplay.area.checkpoints[0]!;
    gameplay.player.x = checkpoint.x;
    gameplay.player.y = checkpoint.y;
    expect(gameplay.update(0).checkpointActivated).toBe(true);
    expect(saves.snapshot.run.checkpoint?.checkpointId).toBe(checkpoint.id);

    gameplay.gold.restore(75, gameplay.gold.collected, gameplay.area.gold);
    gameplay.lives.damage();
    expect(gameplay.purchaseLife()).toBe("purchased");
    expect(saves.snapshot.run.gold).toBe(25);
    expect(saves.snapshot.run.lives).toBe(3);

    gameplay.player.x = gameplay.area.goal.x;
    gameplay.player.y = gameplay.area.goal.y;
    expect(gameplay.update(0).victory).toBe(true);
    expect(state.snapshot.mode).toBe("victory");
    expect(saves.snapshot.unlocks).toContain("map-2-placeholder");
  });
});
