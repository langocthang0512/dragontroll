import type { Rect } from "../physics/collision";

export interface Player extends Rect {
  vx: number;
  vy: number;
  ground: boolean;
  face: -1 | 1;
  wasGrounded: boolean;
}

export function createPlayer(): Player {
  return {
    x: 60,
    y: 360,
    w: 28,
    h: 46,
    vx: 0,
    vy: 0,
    ground: false,
    face: 1,
    wasGrounded: false,
  };
}
