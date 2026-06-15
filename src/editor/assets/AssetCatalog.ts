import type { EditorLayerId, EditorObjectKind } from "../maps/EditorMap";

export const ASSET_CATEGORIES = [
  "Characters", "Weapons", "Enemies", "Enemy Variants", "Traps", "Coins", "Collectibles",
  "Objects", "Decorations", "Platforms", "Background", "Environment", "Effects", "UI",
  "Checkpoint", "Map Elements",
] as const;

export interface EditorAsset {
  id: string;
  name: string;
  category: typeof ASSET_CATEGORIES[number];
  kind: EditorObjectKind;
  layer: EditorLayerId;
  width: number;
  height: number;
  color: string;
  accent: string;
  animation: string;
  collision: boolean;
  tags: string[];
  description: string;
}

const asset = (
  id: string, name: string, category: EditorAsset["category"], kind: EditorObjectKind,
  layer: EditorLayerId, width: number, height: number, color: string, accent: string,
  tags: string[], animation = "none", collision = false,
): EditorAsset => ({ id, name, category, kind, layer, width, height, color, accent, tags, animation, collision, description: `${name} production asset` });

export const EDITOR_ASSETS: readonly EditorAsset[] = [
  asset("character-male", "Male Adventurer", "Characters", "ui-marker", "ui", 32, 48, "#263b55", "#d64c47", ["player", "male", "animated"], "idle"),
  asset("character-female", "Female Adventurer", "Characters", "ui-marker", "ui", 32, 48, "#263b55", "#d64c47", ["player", "female", "animated"], "idle"),
  asset("sword-ceremonial", "Ceremonial Sword", "Weapons", "ui-marker", "ui", 18, 52, "#d6d8c8", "#d6a34a", ["sword", "melee", "weapon"]),
  asset("dragon-jade", "Jade Dragon", "Enemies", "enemy", "enemy", 38, 42, "#2f7554", "#e1bd58", ["dragon", "patrol", "contact"], "walk", true),
  asset("dragon-amethyst", "Amethyst Dragon", "Enemy Variants", "enemy", "enemy", 38, 42, "#66416c", "#f1a65d", ["dragon", "purple", "variant"], "walk", true),
  asset("dragon-ember", "Ember Dragon", "Enemy Variants", "enemy", "enemy", 38, 42, "#9a3d2e", "#f3cb68", ["dragon", "red", "variant"], "walk", true),
  asset("trap-falling-egg", "Falling Egg", "Traps", "falling-egg", "trap", 28, 36, "#6e3d67", "#efd590", ["egg", "falling", "telegraph"], "fall", true),
  asset("trap-spikes", "Ancient Spikes", "Traps", "spikes", "trap", 64, 18, "#8d9aa0", "#a6473f", ["spike", "damage", "stone"], "none", true),
  asset("coin-gold", "Faceted Gold", "Coins", "gold", "gameplay", 20, 20, "#ffcd48", "#fff1a0", ["gold", "coin", "pickup"], "spin", true),
  asset("collectible-gem", "Lost Gem", "Collectibles", "gold", "gameplay", 20, 24, "#d34f74", "#ffd36b", ["gem", "collectible", "rare"], "pulse", true),
  asset("object-idol", "Dragon Idol", "Objects", "decoration", "decoration", 68, 78, "#253f43", "#d5c56e", ["idol", "stone", "ruin"]),
  asset("decoration-tree", "Root Tree", "Decorations", "decoration", "decoration", 120, 210, "#102d31", "#6b995d", ["tree", "root", "jungle"]),
  asset("decoration-ruin", "Broken Ruin", "Decorations", "decoration", "decoration", 130, 130, "#3d5a55", "#709b58", ["ruin", "stone", "moss"]),
  asset("decoration-vine", "Hanging Vine", "Decorations", "decoration", "decoration", 34, 170, "#2c684d", "#9bbd69", ["vine", "hanging", "plant"]),
  asset("platform-ground", "Carved Ground", "Platforms", "platform", "gameplay", 192, 40, "#29443f", "#bbcf78", ["platform", "ground", "collision"], "none", true),
  asset("platform-ledge", "Moss Ledge", "Platforms", "platform", "gameplay", 144, 18, "#3b5550", "#86a860", ["platform", "ledge", "collision"], "none", true),
  asset("background-lost-world", "Lost World Panorama", "Background", "background", "background", 960, 540, "#12394a", "#d9ed8c", ["background", "panorama", "jungle"]),
  asset("environment-waterfall", "Waterfall", "Environment", "decoration", "decoration", 54, 220, "#68b8b3", "#d9f0dc", ["water", "environment", "animated"], "flow"),
  asset("effect-mist", "Jungle Mist", "Effects", "effect", "effects", 180, 24, "#d6ebc1", "#ffffff", ["mist", "effect", "ambient"], "drift"),
  asset("ui-marker", "UI Marker", "UI", "ui-marker", "ui", 32, 32, "#18343c", "#f0c35a", ["ui", "marker", "editor"]),
  asset("checkpoint-door", "Ancient Door", "Checkpoint", "checkpoint", "gameplay", 42, 64, "#2c4c49", "#d8f09b", ["checkpoint", "door", "spawn"], "glow", true),
  asset("map-spawn", "Player Spawn", "Map Elements", "spawn", "gameplay", 28, 46, "#3f5c78", "#ec6a55", ["spawn", "player", "map"]),
  asset("map-goal", "Ancient Goal", "Map Elements", "goal", "gameplay", 78, 86, "#294843", "#d9ed8c", ["goal", "exit", "map"], "glow", true),
];

export function findAsset(assetId: string): EditorAsset | undefined {
  return EDITOR_ASSETS.find((item) => item.id === assetId);
}
