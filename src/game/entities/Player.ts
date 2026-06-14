import type { Rect } from "../physics/collision";

export interface Player extends Rect {
  vx: number;
  vy: number;
  ground: boolean;
  face: -1 | 1;
}

export function createPlayer(): Player {
  return {
    x: 60,
    y: 360,
    w: 42,
    h: 34,
    vx: 0,
    vy: 0,
    ground: false,
    face: 1,
  };
}
