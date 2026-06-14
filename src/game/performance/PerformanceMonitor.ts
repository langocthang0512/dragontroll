export interface PerformanceSnapshot {
  fps: number;
  frameTimeMs: number;
  updateCount: number;
}

export class PerformanceMonitor {
  private lastTimestamp = 0;
  private sampleElapsed = 0;
  private sampleFrames = 0;
  private fps = 0;
  private frameTimeMs = 0;
  private updateCount = 0;

  recordFrame(timestamp: number, updates: number): void {
    if (this.lastTimestamp > 0) {
      const elapsed = timestamp - this.lastTimestamp;
      this.frameTimeMs = elapsed;
      this.sampleElapsed += elapsed;
      this.sampleFrames++;
      if (this.sampleElapsed >= 500) {
        this.fps = (this.sampleFrames * 1000) / this.sampleElapsed;
        this.sampleElapsed = 0;
        this.sampleFrames = 0;
      }
    }
    this.lastTimestamp = timestamp;
    this.updateCount = updates;
  }

  get snapshot(): PerformanceSnapshot {
    return {
      fps: this.fps,
      frameTimeMs: this.frameTimeMs,
      updateCount: this.updateCount,
    };
  }
}
