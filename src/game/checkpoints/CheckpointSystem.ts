export interface CheckpointPosition {
  x: number;
  y: number;
}

export class CheckpointSystem {
  private position: CheckpointPosition = { x: 0, y: 0 };

  reset(position: CheckpointPosition): void {
    this.position = { ...position };
  }

  activate(position: CheckpointPosition): void {
    this.position = { ...position };
  }

  restore(): CheckpointPosition {
    return { ...this.position };
  }
}
