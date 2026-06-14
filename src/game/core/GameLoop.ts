export interface GameLoopOptions {
  updatesPerSecond: number;
  maxFrameDeltaMs: number;
  maxUpdatesPerFrame: number;
  update: (deltaSeconds: number) => void;
  render: (interpolation: number) => void;
  afterFrame?: (timestamp: number, updates: number) => void;
}

export class GameLoop {
  private animationFrame = 0;
  private previousTimestamp = 0;
  private accumulator = 0;
  private running = false;
  private readonly stepMs: number;

  constructor(private readonly options: GameLoopOptions) {
    this.stepMs = 1000 / options.updatesPerSecond;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.previousTimestamp = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
  }

  private readonly tick = (timestamp: number): void => {
    if (!this.running) return;

    const frameDelta = Math.min(timestamp - this.previousTimestamp, this.options.maxFrameDeltaMs);
    this.previousTimestamp = timestamp;
    this.accumulator += frameDelta;

    let updates = 0;
    while (this.accumulator >= this.stepMs && updates < this.options.maxUpdatesPerFrame) {
      this.options.update(this.stepMs / 1000);
      this.accumulator -= this.stepMs;
      updates++;
    }

    if (updates === this.options.maxUpdatesPerFrame) this.accumulator = 0;
    this.options.render(this.accumulator / this.stepMs);
    this.options.afterFrame?.(timestamp, updates);
    this.animationFrame = requestAnimationFrame(this.tick);
  };
}
