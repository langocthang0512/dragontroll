import type { LevelMap, LevelSource } from "./types";

export class MapLoader {
  constructor(private readonly maps: readonly LevelSource[]) {
    if (maps.length === 0) throw new Error("At least one map is required.");
  }

  get count(): number {
    return this.maps.length;
  }

  load(index: number): LevelMap {
    const source = this.maps[index];
    if (!source) throw new RangeError(`Map index out of range: ${index}`);
    const map = structuredClone(source);
    return {
      ...map,
      bg: [...map.bg],
      crumbly: map.crumbly ?? [],
      moving: map.moving ?? [],
      spikes: map.spikes ?? [],
      lava: map.lava ?? [],
      gems: map.gems ?? [],
      fallingBlocks: map.fallingBlocks ?? [],
      enemies: map.enemies ?? [],
      checkpoints: map.checkpoints ?? [],
      textTraps: map.textTraps ?? [],
    };
  }
}
