import type { Rect } from "../physics/collision";

export interface Platform extends Rect {
  gone?: boolean;
}

export interface CrumblyPlatform extends Platform {
  delay: number;
  fall: boolean;
  timer: number;
  vy: number;
}

export interface MovingPlatform extends Platform {
  startX: number;
  startY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  speed: number;
  dir: number;
  axis: "x" | "y";
  dx?: number;
  dy?: number;
}

export interface FallingBlock extends Rect {
  startY: number;
  vy: number;
  active: boolean;
  triggered?: boolean;
  gone?: boolean;
}

export interface Enemy extends Rect {
  left: number;
  right: number;
  speed: number;
  boss?: boolean;
}

export interface Checkpoint extends Rect {
  real: boolean;
}

export interface Gem extends Rect {
  trap: "platform" | "enemy" | "fall" | "spike" | "iceSpike" | "wind" | "fakeWin" | "boss";
  active?: boolean;
}

export interface TextTrap extends Rect {
  msg: string;
  done?: boolean;
}

export interface LevelSource {
  name: string;
  bg: readonly [string, string];
  width: number;
  start: { x: number; y: number };
  egg: Rect;
  ice?: boolean;
  boss?: boolean;
  platforms: Platform[];
  crumbly?: CrumblyPlatform[];
  moving?: MovingPlatform[];
  spikes?: Rect[];
  lava?: Rect[];
  gems?: Gem[];
  fallingBlocks?: FallingBlock[];
  enemies?: Enemy[];
  checkpoints?: Checkpoint[];
  textTraps?: TextTrap[];
}

export interface LevelMap extends Omit<LevelSource, "bg" | "crumbly" | "moving" | "spikes" | "lava" | "gems" | "fallingBlocks" | "enemies" | "checkpoints" | "textTraps"> {
  bg: [string, string];
  crumbly: CrumblyPlatform[];
  moving: MovingPlatform[];
  spikes: Rect[];
  lava: Rect[];
  gems: Gem[];
  fallingBlocks: FallingBlock[];
  enemies: Enemy[];
  checkpoints: Checkpoint[];
  textTraps: TextTrap[];
}
