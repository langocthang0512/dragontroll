import type { AssetManifest } from "./AssetLoader";

export const PLAYER_ATLAS_IMAGE = "player-atlas-image";
export const PLAYER_ATLAS_DATA = "player-atlas-data";
export const LOST_WORLD_BACKGROUND = "lost-world-background";

export const assetManifest: AssetManifest = [
  {
    id: PLAYER_ATLAS_IMAGE,
    type: "image",
    url: new URL("../../../assets/player/player-atlas.png", import.meta.url).href,
  },
  {
    id: PLAYER_ATLAS_DATA,
    type: "json",
    url: new URL("../../../assets/animation/player-atlas.json", import.meta.url).href,
  },
  {
    id: LOST_WORLD_BACKGROUND,
    type: "image",
    url: new URL("../../../assets/environment/lost-world-panorama.webp", import.meta.url).href,
  },
];
