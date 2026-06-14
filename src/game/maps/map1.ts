import { GAMEPLAY_CONFIG } from "../../config/gameplay";
import type { EnemyEntity, FallingHazard, GoldPickup, PrototypeArea, StaticPlatform } from "../gameplay/types";

const ground = (id: string, x: number, width: number): StaticPlatform => ({ id, x, y: 500, w: width, h: 40 });
const ledge = (id: string, x: number, y: number, width: number): StaticPlatform => ({ id, x, y, w: width, h: 18 });
const gold = (id: string, x: number, y: number, value = 5): GoldPickup => ({ id, x, y, w: 20, h: 20, value, collected: false });

function enemy(id: string, x: number, patrolMin: number, patrolMax: number): EnemyEntity {
  return {
    id, x, y: 458, w: 38, h: 42,
    patrolMin, patrolMax,
    direction: 1,
    speed: GAMEPLAY_CONFIG.enemyPatrolSpeed,
    shootCooldownRemaining: 0.4,
    alive: true,
    hitCount: 0,
    flashRemaining: 0,
  };
}

function hazard(id: string, x: number, triggerWidth = 120): FallingHazard {
  return {
    id, x, y: 92, w: 28, h: 36,
    spawnY: 92,
    resetY: 500,
    triggerX: x - triggerWidth / 2,
    triggerWidth,
    state: "idle",
    telegraphRemaining: 0,
    vy: 0,
  };
}

export function createMap1(): PrototypeArea {
  return {
    id: "map-1-lost-world",
    name: "MAP 1  LOST WORLD",
    width: 7200,
    height: 540,
    voidY: 680,
    spawn: { x: 84, y: 420 },
    platforms: [
      ground("ground-01", 0, 620),
      ground("ground-02", 740, 600),
      ground("ground-03", 1460, 920),
      ground("ground-04", 2500, 800),
      ground("ground-05", 3420, 1140),
      ground("ground-06", 4700, 900),
      ground("ground-07", 5720, 1480),
      ledge("intro-step", 300, 430, 150),
      ledge("jump-a", 820, 410, 150),
      ledge("jump-b", 1040, 340, 150),
      ledge("jump-c", 1230, 405, 110),
      ledge("combat-perch", 1840, 385, 160),
      ledge("secret-ledge", 2180, 306, 150),
      ledge("trap-step-a", 2620, 410, 120),
      ledge("trap-step-b", 2860, 350, 130),
      ledge("checkpoint-arch", 3500, 392, 190),
      ledge("mixed-a", 3840, 410, 130),
      ledge("mixed-b", 4170, 342, 145),
      ledge("mixed-c", 4430, 405, 130),
      ledge("ruin-top", 4860, 330, 180),
      ledge("mixed-secret", 5280, 382, 170),
      ledge("final-a", 5840, 410, 140),
      ledge("final-b", 6150, 348, 160),
      ledge("goal-rise", 6540, 410, 160),
    ],
    checkpoints: [{ id: "lost-world-door", x: 3580, y: 436, w: 42, h: 64 }],
    gold: [
      gold("m1-gold-01", 340, 392),
      gold("m1-gold-02", 560, 462),
      gold("m1-gold-03", 880, 372),
      gold("m1-gold-04", 1090, 302),
      gold("m1-gold-05", 1280, 367),
      gold("m1-gold-06", 1660, 462),
      gold("m1-gold-07", 1900, 347, 10),
      gold("m1-gold-secret", 2240, 268, 15),
      gold("m1-gold-08", 2680, 372),
      gold("m1-gold-09", 2920, 312, 10),
      gold("m1-gold-10", 3270, 462),
      gold("m1-gold-11", 3910, 372),
      gold("m1-gold-12", 4240, 304, 10),
      gold("m1-gold-13", 4920, 292, 10),
      gold("m1-gold-risk", 5500, 462, 15),
      gold("m1-gold-14", 6220, 310, 10),
      gold("m1-gold-15", 6640, 372, 10),
    ],
    enemies: [
      enemy("moss-drake-01", 1710, 1600, 1810),
      enemy("moss-drake-02", 2050, 1990, 2180),
      enemy("moss-drake-03", 3990, 3950, 4140),
      enemy("moss-drake-04", 4780, 4740, 4910),
      enemy("moss-drake-05", 5940, 5900, 6100),
      enemy("moss-drake-06", 6360, 6310, 6490),
    ],
    hazards: [
      hazard("ruin-egg-01", 2760),
      hazard("ruin-egg-02", 3100),
      hazard("ruin-egg-03", 4340),
      hazard("ruin-egg-04", 5150),
      hazard("ruin-egg-05", 6260),
    ],
    goal: { id: "ancient-gate", x: 6900, y: 414, w: 78, h: 86 },
    sections: [
      { id: "intro", label: "SAFE INTRO", startX: 0, endX: 740 },
      { id: "platforming", label: "SUNKEN STEPS", startX: 740, endX: 1460 },
      { id: "combat", label: "MOSS DRAKE GROVE", startX: 1460, endX: 2500 },
      { id: "traps", label: "FALLING NEST", startX: 2500, endX: 3420 },
      { id: "checkpoint", label: "ANCIENT DOOR", startX: 3420, endX: 3820 },
      { id: "mixed", label: "DROWNED RUINS", startX: 3820, endX: 5720 },
      { id: "final", label: "PALACE APPROACH", startX: 5720, endX: 6750 },
      { id: "complete", label: "LOST WORLD HEART", startX: 6750, endX: 7200 },
    ],
    decorations: [
      { id: "tree-01", kind: "tree", x: 180, y: 500, scale: 1 },
      { id: "idol-01", kind: "idol", x: 520, y: 500, scale: 1 },
      { id: "ruin-01", kind: "ruin", x: 900, y: 500, scale: 1.2 },
      { id: "waterfall-01", kind: "waterfall", x: 1370, y: 210, scale: 1 },
      { id: "tree-02", kind: "tree", x: 2320, y: 500, scale: 1.35 },
      { id: "vine-01", kind: "vine", x: 2740, y: 80, scale: 1 },
      { id: "idol-02", kind: "idol", x: 3300, y: 500, scale: 1.2 },
      { id: "ruin-02", kind: "ruin", x: 3720, y: 500, scale: 1.4 },
      { id: "flower-01", kind: "flower", x: 4550, y: 500, scale: 1 },
      { id: "waterfall-02", kind: "waterfall", x: 5620, y: 180, scale: 1.25 },
      { id: "tree-03", kind: "tree", x: 6500, y: 500, scale: 1.4 },
    ],
  };
}
