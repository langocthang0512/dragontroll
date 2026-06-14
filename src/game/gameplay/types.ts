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

export interface EnemyEntity extends TrainingTarget {
  patrolMin: number;
  patrolMax: number;
  direction: -1 | 1;
  speed: number;
  alive: boolean;
}

export interface SpikeTrap extends Rect {
  id: string;
}

export type FallingHazardState = "idle" | "telegraph" | "falling";

export interface FallingHazard extends Rect {
  id: string;
  spawnY: number;
  resetY: number;
  triggerX: number;
  triggerWidth: number;
  state: FallingHazardState;
  telegraphRemaining: number;
  vy: number;
}

export interface GoalObject extends Rect {
  id: string;
}

export interface LevelSection {
  id: string;
  label: string;
  startX: number;
  endX: number;
}

export type DecorationKind = "tree" | "ruin" | "idol" | "vine" | "flower" | "waterfall";

export interface EnvironmentDecoration {
  id: string;
  kind: DecorationKind;
  x: number;
  y: number;
  scale: number;
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
  target?: TrainingTarget;
  enemies: EnemyEntity[];
  hazards: FallingHazard[];
  spikes: SpikeTrap[];
  goal: GoalObject;
  sections: LevelSection[];
  decorations: EnvironmentDecoration[];
}
