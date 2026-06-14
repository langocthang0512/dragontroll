import { beforeEach, describe, expect, it, vi } from "vitest";
import { GAMEPLAY_CONFIG } from "../src/config/gameplay";
import { CheckpointSystem } from "../src/game/checkpoints/CheckpointSystem";
import { createPlayer } from "../src/game/entities/Player";
import type { GoldPickup, StaticPlatform, TrainingTarget } from "../src/game/gameplay/types";
import { SaveManager } from "../src/game/save/SaveManager";
import { CombatSystem } from "../src/game/systems/CombatSystem";
import { GoldSystem } from "../src/game/systems/GoldSystem";
import { LivesSystem } from "../src/game/systems/LivesSystem";
import { PlayerMovementSystem } from "../src/game/systems/PlayerMovementSystem";
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
});
