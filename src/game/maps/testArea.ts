import type { PrototypeArea } from "../gameplay/types";

export function createTestArea(): PrototypeArea {
  return {
    id: "core-systems-yard",
    name: "CORE SYSTEMS TEST YARD",
    width: 1920,
    height: 540,
    voidY: 660,
    spawn: { x: 72, y: 420 },
    platforms: [
      { id: "ground-a", x: 0, y: 500, w: 500, h: 40 },
      { id: "ground-b", x: 640, y: 500, w: 1280, h: 40 },
      { id: "step-a", x: 220, y: 418, w: 150, h: 20 },
      { id: "step-b", x: 430, y: 350, w: 130, h: 20 },
      { id: "step-c", x: 720, y: 400, w: 160, h: 20 },
      { id: "step-d", x: 1010, y: 330, w: 150, h: 20 },
      { id: "step-e", x: 1320, y: 410, w: 180, h: 20 },
    ],
    checkpoints: [
      { id: "checkpoint-alpha", x: 780, y: 436, w: 42, h: 64 },
    ],
    gold: [
      { id: "gold-a", x: 270, y: 380, w: 20, h: 20, value: 1, collected: false },
      { id: "gold-b", x: 470, y: 312, w: 20, h: 20, value: 1, collected: false },
      { id: "gold-c", x: 1068, y: 292, w: 20, h: 20, value: 1, collected: false },
      { id: "gold-d", x: 1390, y: 372, w: 20, h: 20, value: 1, collected: false },
    ],
    target: { id: "training-dummy", x: 1190, y: 438, w: 28, h: 62, hitCount: 0, flashRemaining: 0 },
    enemies: [],
    hazards: [],
    spikes: [],
    goal: { id: "test-goal", x: 1800, y: 430, w: 40, h: 70 },
    sections: [{ id: "test", label: "TEST", startX: 0, endX: 1920 }],
    decorations: [],
  };
}
