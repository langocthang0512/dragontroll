export interface CheckpointPosition {
  x: number;
  y: number;
}

export interface ActiveCheckpoint extends CheckpointPosition {
  id: string;
  areaId: string;
}

export class CheckpointSystem {
  private position: CheckpointPosition = { x: 0, y: 0 };
  private activeCheckpoint?: ActiveCheckpoint;

  reset(position: CheckpointPosition): void {
    this.position = { ...position };
    this.activeCheckpoint = undefined;
  }

  activate(position: CheckpointPosition): void;
  activate(checkpoint: ActiveCheckpoint): boolean;
  activate(checkpoint: CheckpointPosition | ActiveCheckpoint): boolean | void {
    this.position = { x: checkpoint.x, y: checkpoint.y };
    if (!("id" in checkpoint)) return;
    const changed = this.activeCheckpoint?.id !== checkpoint.id || this.activeCheckpoint.areaId !== checkpoint.areaId;
    this.activeCheckpoint = { ...checkpoint };
    return changed;
  }

  hydrate(checkpoint: ActiveCheckpoint | undefined, fallback: CheckpointPosition): void {
    if (!checkpoint) {
      this.reset(fallback);
      return;
    }
    this.activeCheckpoint = { ...checkpoint };
    this.position = { x: checkpoint.x, y: checkpoint.y };
  }

  restore(): CheckpointPosition {
    return { ...this.position };
  }

  get active(): ActiveCheckpoint | undefined {
    return this.activeCheckpoint ? { ...this.activeCheckpoint } : undefined;
  }

  isActive(areaId: string, checkpointId: string): boolean {
    return this.activeCheckpoint?.areaId === areaId && this.activeCheckpoint.id === checkpointId;
  }
}
