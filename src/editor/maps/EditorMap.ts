import type { PrototypeArea } from "../../game/gameplay/types";

export const EDITOR_LAYERS = ["background", "decoration", "gameplay", "enemy", "trap", "foreground", "effects", "ui"] as const;
export type EditorLayerId = typeof EDITOR_LAYERS[number];

export type EditorObjectKind =
  | "spawn" | "platform" | "decoration" | "gold" | "enemy" | "falling-egg"
  | "spikes" | "checkpoint" | "goal" | "background" | "effect" | "ui-marker";

export interface EditorLayer {
  id: EditorLayerId;
  label: string;
  visible: boolean;
  locked: boolean;
}

export interface EditorObject {
  id: string;
  assetId: string;
  kind: EditorObjectKind;
  layer: EditorLayerId;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  animation: string;
  collision: boolean;
  behavior: string;
  difficulty: number;
  metadata: Record<string, string | number | boolean>;
}

export interface EditorRevision {
  id: string;
  label: string;
  status: "draft" | "published";
  createdAt: string;
}

export interface EditorMapDocument {
  schemaVersion: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  voidY: number;
  gridSize: number;
  status: "draft" | "published";
  revision: number;
  updatedAt: string;
  layers: EditorLayer[];
  objects: EditorObject[];
}

const layerLabels: Record<EditorLayerId, string> = {
  background: "Background",
  decoration: "Decoration",
  gameplay: "Gameplay",
  enemy: "Enemy",
  trap: "Trap",
  foreground: "Foreground",
  effects: "Effects",
  ui: "UI",
};

export function createLayers(): EditorLayer[] {
  return EDITOR_LAYERS.map((id) => ({ id, label: layerLabels[id], visible: true, locked: false }));
}

export function cloneEditorMap(document: EditorMapDocument): EditorMapDocument {
  return structuredClone(document);
}

export function validateEditorMap(value: unknown): EditorMapDocument {
  if (!value || typeof value !== "object") throw new Error("Map document must be an object.");
  const map = value as Partial<EditorMapDocument>;
  if (map.schemaVersion !== 1 || typeof map.id !== "string" || typeof map.name !== "string") {
    throw new Error("Unsupported editor map format.");
  }
  if (!Array.isArray(map.layers) || !Array.isArray(map.objects)) throw new Error("Map layers or objects are missing.");
  const layerIds = new Set(map.layers.map((layer) => layer.id));
  for (const id of EDITOR_LAYERS) if (!layerIds.has(id)) throw new Error(`Missing layer: ${id}`);
  for (const object of map.objects) {
    if (!object.id || !object.assetId || !layerIds.has(object.layer)) throw new Error("Map contains an invalid object.");
    for (const number of [object.x, object.y, object.width, object.height, object.scale, object.rotation]) {
      if (!Number.isFinite(number)) throw new Error(`Invalid transform on object: ${object.id}`);
    }
  }
  return cloneEditorMap(map as EditorMapDocument);
}

export function editorMapToArea(document: EditorMapDocument): PrototypeArea {
  const objects = document.objects;
  const spawn = objects.find((object) => object.kind === "spawn");
  const goal = objects.find((object) => object.kind === "goal");
  const scaled = (object: EditorObject) => ({
    id: object.id,
    x: object.x,
    y: object.y,
    w: object.width * object.scale,
    h: object.height * object.scale,
  });
  return {
    id: document.id,
    name: document.name.toUpperCase(),
    width: document.width,
    height: document.height,
    voidY: document.voidY,
    spawn: { x: spawn?.x ?? 84, y: spawn?.y ?? 420 },
    platforms: objects.filter((object) => object.kind === "platform").map(scaled),
    checkpoints: objects.filter((object) => object.kind === "checkpoint").map(scaled),
    gold: objects.filter((object) => object.kind === "gold").map((object) => ({
      ...scaled(object), value: Number(object.metadata.value ?? 5), collected: false,
    })),
    enemies: objects.filter((object) => object.kind === "enemy").map((object) => ({
      ...scaled(object),
      patrolMin: Number(object.metadata.patrolMin ?? object.x - 80),
      patrolMax: Number(object.metadata.patrolMax ?? object.x + 80),
      direction: object.metadata.direction === -1 ? -1 : 1,
      speed: Number(object.metadata.speed ?? 42),
      alive: true,
      hitCount: 0,
      flashRemaining: 0,
    })),
    hazards: objects.filter((object) => object.kind === "falling-egg").map((object) => ({
      ...scaled(object),
      spawnY: object.y,
      resetY: Number(object.metadata.resetY ?? 500),
      triggerX: Number(object.metadata.triggerX ?? object.x - 60),
      triggerWidth: Number(object.metadata.triggerWidth ?? 120),
      state: "idle",
      telegraphRemaining: 0,
      vy: 0,
    })),
    spikes: objects.filter((object) => object.kind === "spikes").map(scaled),
    goal: goal ? scaled(goal) : { id: "editor-goal", x: document.width - 160, y: 414, w: 78, h: 86 },
    sections: [{ id: "editor", label: "EDITOR PLAYTEST", startX: 0, endX: document.width }],
    decorations: objects.filter((object) => object.kind === "decoration").map((object) => ({
      id: object.id,
      kind: String(object.metadata.decorationKind ?? "ruin") as "tree" | "ruin" | "idol" | "vine" | "flower" | "waterfall",
      x: object.x,
      y: object.y,
      scale: object.scale,
    })),
  };
}
