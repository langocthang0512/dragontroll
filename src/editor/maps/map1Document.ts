import type { PrototypeArea } from "../../game/gameplay/types";
import type { EditorMapDocument, EditorObject } from "./EditorMap";
import { createLayers } from "./EditorMap";

export function validatePrototypeArea(value: unknown): PrototypeArea {
  if (!value || typeof value !== "object") throw new Error("Native map must be an object.");
  const area = value as Partial<PrototypeArea>;
  if (typeof area.id !== "string" || typeof area.name !== "string" || !Number.isFinite(area.width) || !Number.isFinite(area.height)) {
    throw new Error("Unsupported native map format.");
  }
  if (!area.spawn || !area.goal || !Array.isArray(area.platforms) || !Array.isArray(area.checkpoints) ||
      !Array.isArray(area.gold) || !Array.isArray(area.enemies) || !Array.isArray(area.hazards) ||
      !Array.isArray(area.spikes) || !Array.isArray(area.sections) || !Array.isArray(area.decorations)) {
    throw new Error("Native map content is incomplete.");
  }
  return structuredClone(area as PrototypeArea);
}

export function areaToEditorMap(area: PrototypeArea): EditorMapDocument {
  const object = (partial: Omit<EditorObject, "scale" | "rotation" | "animation" | "difficulty" | "metadata"> & Partial<Pick<EditorObject, "scale" | "rotation" | "animation" | "difficulty" | "metadata">>): EditorObject => ({
    scale: 1, rotation: 0, animation: "none", difficulty: 1, metadata: {}, ...partial,
  });
  const objects: EditorObject[] = [
    object({ id: "player-spawn", assetId: "map-spawn", kind: "spawn", layer: "gameplay", x: area.spawn.x, y: area.spawn.y, width: 28, height: 46, collision: false, behavior: "spawn" }),
    ...area.platforms.map((item) => object({ id: item.id, assetId: item.h > 20 ? "platform-ground" : "platform-ledge", kind: "platform", layer: "gameplay", x: item.x, y: item.y, width: item.w, height: item.h, collision: true, behavior: "static" })),
    ...area.gold.map((item) => object({ id: item.id, assetId: "coin-gold", kind: "gold", layer: "gameplay", x: item.x, y: item.y, width: item.w, height: item.h, collision: true, behavior: "pickup", animation: "spin", metadata: { value: item.value } })),
    ...area.enemies.map((item, index) => object({ id: item.id, assetId: ["dragon-jade", "dragon-amethyst", "dragon-ember"][index % 3]!, kind: "enemy", layer: "enemy", x: item.x, y: item.y, width: item.w, height: item.h, collision: true, behavior: "patrol-approach", animation: "walk", difficulty: 2, metadata: { patrolMin: item.patrolMin, patrolMax: item.patrolMax, speed: item.speed, direction: item.direction } })),
    ...area.hazards.map((item) => object({ id: item.id, assetId: "trap-falling-egg", kind: "falling-egg", layer: "trap", x: item.x, y: item.y, width: item.w, height: item.h, collision: true, behavior: "falling-telegraph", animation: "fall", difficulty: 2, metadata: { resetY: item.resetY, triggerX: item.triggerX, triggerWidth: item.triggerWidth } })),
    ...area.spikes.map((item) => object({ id: item.id, assetId: "trap-spikes", kind: "spikes", layer: "trap", x: item.x, y: item.y, width: item.w, height: item.h, collision: true, behavior: "touch-damage", difficulty: 2 })),
    ...area.checkpoints.map((item) => object({ id: item.id, assetId: "checkpoint-door", kind: "checkpoint", layer: "gameplay", x: item.x, y: item.y, width: item.w, height: item.h, collision: true, behavior: "checkpoint", animation: "glow" })),
    ...area.decorations.map((item) => object({ id: item.id, assetId: item.kind === "waterfall" ? "environment-waterfall" : item.kind === "tree" ? "decoration-tree" : item.kind === "vine" ? "decoration-vine" : item.kind === "idol" ? "object-idol" : "decoration-ruin", kind: "decoration", layer: "decoration", x: item.x, y: item.y, width: 96, height: 120, scale: item.scale, collision: false, behavior: "decorative", metadata: { decorationKind: item.kind } })),
    object({ id: area.goal.id, assetId: "map-goal", kind: "goal", layer: "gameplay", x: area.goal.x, y: area.goal.y, width: area.goal.w, height: area.goal.h, collision: true, behavior: "level-complete", animation: "glow" }),
    object({ id: "lost-world-background", assetId: "background-lost-world", kind: "background", layer: "background", x: 0, y: 0, width: area.width, height: area.height, collision: false, behavior: "parallax" }),
  ];
  return {
    schemaVersion: 1,
    id: area.id,
    name: area.name,
    width: area.width,
    height: area.height,
    voidY: area.voidY,
    gridSize: 16,
    status: "draft",
    revision: 1,
    updatedAt: new Date().toISOString(),
    layers: createLayers(),
    objects,
  };
}
