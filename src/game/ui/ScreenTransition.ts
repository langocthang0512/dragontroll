export class ScreenTransition {
  private elapsed = 0;
  private switchScene?: () => void;
  private switched = false;

  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly width: number,
    private readonly height: number,
    private readonly halfDuration = 0.18,
  ) {}

  get active(): boolean {
    return this.switchScene !== undefined;
  }

  start(switchScene: () => void): void {
    if (this.active) return;
    this.elapsed = 0;
    this.switched = false;
    this.switchScene = switchScene;
  }

  update(deltaSeconds: number): void {
    if (!this.switchScene) return;
    this.elapsed += deltaSeconds;
    if (!this.switched && this.elapsed >= this.halfDuration) {
      this.switched = true;
      this.switchScene();
    }
    if (this.elapsed >= this.halfDuration * 2) this.switchScene = undefined;
  }

  render(): void {
    if (!this.switchScene) return;
    const phase = this.elapsed / this.halfDuration;
    const alpha = phase <= 1 ? phase : 2 - phase;
    this.context.fillStyle = `rgba(8,11,20,${Math.max(0, Math.min(1, alpha))})`;
    this.context.fillRect(0, 0, this.width, this.height);
  }
}
