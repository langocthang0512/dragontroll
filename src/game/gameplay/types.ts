import type { Rect } from "../physics/collision";

export interface MovementInput {
  horizontal: -1 | 0 | 1;
  jumpPressed: boolean;
  jumpHeld: boolean;
}

export interface StaticPlatform extends Rect {
  id: string;
}

export interface CheckpointObject extends Rect {
  id: string;
}

export interface GoldPickup extends Rect {
  id: string;
  value: number;
  collected: boolean;
}

export interface TrainingTarget extends Rect {
  id: string;
  hitCount: number;
  flashRemaining: number;
}

export interface PrototypeArea {
  id: string;
  name: string;
  width: number;
  height: number;
  voidY: number;
  spawn: { x: number; y: number };
  platforms: StaticPlatform[];
  checkpoints: CheckpointObject[];
  gold: GoldPickup[];
  target: TrainingTarget;
}
