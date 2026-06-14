import { CameraSystem } from "../camera/CameraSystem";
import { CheckpointSystem } from "../checkpoints/CheckpointSystem";
import type { Player } from "../entities/Player";
import { createPlayer } from "../entities/Player";
import type { InputSystem } from "../input/InputSystem";
import type { MapLoader } from "../maps/MapLoader";
import type { LevelMap, Platform } from "../maps/types";
import { intersects } from "../physics/collision";
import type { SaveManager } from "../save/SaveManager";
import type { GameStateManager } from "../state/GameStateManager";

export class LegacyGameplaySystem {
  readonly player: Player = createPlayer();
  readonly camera: CameraSystem;
  private readonly checkpoints = new CheckpointSystem();
  private currentMap?: LevelMap;

  constructor(
    private readonly input: InputSystem,
    private readonly maps: MapLoader,
    private readonly state: GameStateManager,
    private readonly saves: SaveManager,
    viewportWidth: number,
    private readonly viewportHeight: number,
  ) {
    this.camera = new CameraSystem(viewportWidth);
  }

  get level(): LevelMap | undefined {
    return this.currentMap;
  }

  loadLevel(index: number): void {
    this.currentMap = this.maps.load(index);
    const { start } = this.currentMap;
    Object.assign(this.player, { x: start.x, y: start.y, vx: 0, vy: 0, ground: false });
    this.checkpoints.reset(start);
    this.camera.reset();
    this.state.patch({ currentLevel: index, levelCleared: false, message: this.currentMap.name });
  }

  newGame(): void {
    this.saves.clear();
    this.state.patch({ deaths: 0 });
    this.loadLevel(0);
  }

  advanceLevel(): void {
    const next = this.state.snapshot.currentLevel + 1;
    if (next < this.maps.count) this.loadLevel(next);
  }

  update(): void {
    const level = this.requireLevel();
    if (this.state.snapshot.levelCleared) return;

    this.updateMovingPlatforms(level);
    this.updatePlayerMovement(level);
    this.handleCrumbly(level);

    if (this.player.y > this.viewportHeight + 160) {
      this.respawn("Void dragon moment.");
      return;
    }

    for (const spike of level.spikes) {
      if (intersects(this.player, spike)) {
        this.respawn("Classic spike. Classic pain.");
        return;
      }
    }

    for (const lava of level.lava) {
      if (intersects(this.player, lava)) {
        this.respawn("Lava bath. Not recommended.");
        return;
      }
    }

    for (const checkpoint of level.checkpoints) {
      if (!intersects(this.player, checkpoint)) continue;
      if (!checkpoint.real) {
        this.respawn("Fake checkpoint. Evil dev moment.");
        return;
      }
      this.checkpoints.activate({ x: checkpoint.x, y: checkpoint.y - this.player.h });
      this.state.patch({ message: "Checkpoint saved." });
    }

    this.handleGems(level);

    for (const block of level.fallingBlocks) {
      if (!block.triggered && Math.abs(this.player.x + this.player.w / 2 - (block.x + block.w / 2)) < 95) {
        block.active = true;
        block.triggered = true;
      }
      if (block.active) {
        block.vy += 0.6;
        block.y += block.vy;
      }
      if (intersects(this.player, block)) {
        this.respawn("Bonk! Falling rock trap.");
        return;
      }
      if (block.y > this.viewportHeight + 100) {
        block.active = false;
        block.gone = true;
      }
    }
    level.fallingBlocks = level.fallingBlocks.filter((block) => !block.gone);

    for (const enemy of level.enemies) {
      enemy.x += enemy.speed;
      if (enemy.x < enemy.left || enemy.x + enemy.w > enemy.right) {
        enemy.speed *= -1;
        enemy.x += enemy.speed;
      }
      if (intersects(this.player, enemy)) {
        this.respawn(enemy.boss ? "Boss hugged too hard." : "Tiny dragon got bullied.");
        return;
      }
    }

    for (const trap of level.textTraps) {
      if (trap.done || !intersects(this.player, trap)) continue;
      trap.done = true;
      this.state.patch({ message: trap.msg });
      level.fallingBlocks.push({
        x: this.player.x + 90,
        y: 70,
        startY: 70,
        w: 48,
        h: 48,
        vy: 0,
        active: true,
        triggered: true,
      });
    }

    if (intersects(this.player, level.egg)) this.completeLevel();
    this.camera.follow(this.player.x, level.width);
  }

  private updatePlayerMovement(level: LevelMap): void {
    if (level.ice) {
      if (this.input.isDown("a", "arrowleft")) {
        this.player.vx -= 0.55;
        this.player.face = -1;
      } else if (this.input.isDown("d", "arrowright")) {
        this.player.vx += 0.55;
        this.player.face = 1;
      } else {
        this.player.vx *= 0.94;
      }
      this.player.vx = Math.max(-6.2, Math.min(6.2, this.player.vx));
    } else {
      this.player.vx = 0;
      if (this.input.isDown("a", "arrowleft")) {
        this.player.vx = -5;
        this.player.face = -1;
      }
      if (this.input.isDown("d", "arrowright")) {
        this.player.vx = 5;
        this.player.face = 1;
      }
    }

    if (this.input.isDown(" ", "w", "arrowup") && this.player.ground) this.player.vy = -14;

    this.player.x += this.player.vx;
    for (const platform of this.getAllPlatforms(level)) {
      if (!intersects(this.player, platform)) continue;
      if (this.player.vx > 0) this.player.x = platform.x - this.player.w;
      if (this.player.vx < 0) this.player.x = platform.x + platform.w;
    }

    this.player.vy += 0.7;
    this.player.y += this.player.vy;
    this.player.ground = false;

    for (const platform of this.getAllPlatforms(level)) {
      if (!intersects(this.player, platform)) continue;
      if (this.player.vy > 0) {
        this.player.y = platform.y - this.player.h;
        this.player.vy = 0;
        this.player.ground = true;
        this.player.x += platform.dx ?? 0;
        this.player.y += platform.dy ?? 0;
      } else if (this.player.vy < 0) {
        this.player.y = platform.y + platform.h;
        this.player.vy = 0;
      }
    }
  }

  private updateMovingPlatforms(level: LevelMap): void {
    for (const platform of level.moving) {
      const oldX = platform.x;
      const oldY = platform.y;
      if (platform.axis === "x") {
        platform.x += platform.speed * platform.dir;
        if (platform.x < platform.minX || platform.x > platform.maxX) {
          platform.dir *= -1;
          platform.x += platform.speed * platform.dir;
        }
      } else {
        platform.y += platform.speed * platform.dir;
        if (platform.y < platform.minY || platform.y > platform.maxY) {
          platform.dir *= -1;
          platform.y += platform.speed * platform.dir;
        }
      }
      platform.dx = platform.x - oldX;
      platform.dy = platform.y - oldY;
    }
  }

  private handleCrumbly(level: LevelMap): void {
    for (const platform of level.crumbly) {
      if (platform.gone) continue;
      const standing = this.player.x + this.player.w > platform.x
        && this.player.x < platform.x + platform.w
        && Math.abs(this.player.y + this.player.h - platform.y) < 4
        && this.player.vy >= 0;
      if (standing && !platform.fall) {
        platform.timer++;
        if (platform.timer >= platform.delay) {
          platform.fall = true;
          platform.vy = 1.5;
          this.state.patch({ message: "Ground collapsed!" });
        }
      }
      if (platform.fall) {
        platform.vy += 0.55;
        platform.y += platform.vy;
        if (platform.y > this.viewportHeight + 80) platform.gone = true;
      }
    }
  }

  private handleGems(level: LevelMap): void {
    for (const gem of level.gems) {
      if (gem.active === false || !intersects(this.player, gem)) continue;
      gem.active = false;
      switch (gem.trap) {
        case "platform":
          level.platforms.push({ x: gem.x + 20, y: gem.y + 10, w: 100, h: 20 });
          this.state.patch({ message: "Gem created suspicious land." });
          break;
        case "enemy":
          level.enemies.push({ x: gem.x + 30, y: gem.y + 10, w: 34, h: 34, left: gem.x, right: gem.x + 190, speed: 3 });
          this.state.patch({ message: "Surprise goblin." });
          break;
        case "fall":
          level.fallingBlocks.push({ x: gem.x - 22, y: 50, startY: 50, w: 60, h: 60, vy: 0, active: true, triggered: true });
          this.state.patch({ message: "That gem called a meteor." });
          break;
        case "spike":
          level.spikes.push({ x: gem.x - 20, y: gem.y + 32, w: 70, h: 42 });
          this.state.patch({ message: "Gem spawned spikes. Rude." });
          break;
        case "iceSpike":
          level.spikes.push({ x: gem.x + 25, y: gem.y + 60, w: 60, h: 42 });
          this.state.patch({ message: "Ice gem made teeth." });
          break;
        case "wind":
          this.player.x -= 90;
          this.player.vx = -12;
          this.state.patch({ message: "Wind says go back." });
          break;
        case "fakeWin":
          this.state.patch({ message: "Fake victory gem. Keep moving." });
          break;
        case "boss":
          level.enemies.push({ x: gem.x + 100, y: gem.y - 20, w: 70, h: 70, left: gem.x + 60, right: gem.x + 360, speed: 4, boss: true });
          level.fallingBlocks.push({ x: gem.x + 230, y: 40, startY: 40, w: 70, h: 70, vy: 0, active: true, triggered: true });
          this.state.patch({ message: "Ancient dragon woke up." });
          break;
      }
    }
  }

  private getAllPlatforms(level: LevelMap): Array<Platform & { dx?: number; dy?: number }> {
    return [...level.platforms, ...level.crumbly, ...level.moving].filter((platform) => !platform.gone);
  }

  private respawn(message: string): void {
    const checkpoint = this.checkpoints.restore();
    this.currentMap = this.maps.load(this.state.snapshot.currentLevel);
    Object.assign(this.player, { x: checkpoint.x, y: checkpoint.y, vx: 0, vy: 0, ground: false });
    this.camera.follow(this.player.x, this.currentMap.width);
    this.state.patch({ deaths: this.state.snapshot.deaths + 1, message });
  }

  private completeLevel(): void {
    const currentLevel = this.state.snapshot.currentLevel;
    const finalLevel = currentLevel === this.maps.count - 1;
    this.saves.saveLevel(finalLevel ? 0 : currentLevel + 1);
    this.state.patch({
      levelCleared: true,
      message: finalLevel ? "YOU WIN! Press R to restart." : "Level cleared! Press ENTER.",
    });
  }

  private requireLevel(): LevelMap {
    if (!this.currentMap) throw new Error("Gameplay updated before a map was loaded.");
    return this.currentMap;
  }
}
