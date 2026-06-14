export class CameraSystem {
  x = 0;
  private targetX = 0;

  constructor(private readonly viewportWidth: number) {}

  follow(subjectX: number, worldWidth: number, deltaSeconds: number, lead = 0.42): void {
    const maxX = Math.max(0, worldWidth - this.viewportWidth);
    this.targetX = Math.max(0, Math.min(maxX, subjectX - this.viewportWidth * lead));
    const smoothing = 1 - Math.exp(-10 * deltaSeconds);
    this.x = Math.round(this.x + (this.targetX - this.x) * smoothing);
  }

  reset(x = 0): void {
    this.targetX = x;
    this.x = Math.round(x);
  }

  snapTo(subjectX: number, worldWidth: number, lead = 0.42): void {
    const maxX = Math.max(0, worldWidth - this.viewportWidth);
    this.reset(Math.max(0, Math.min(maxX, subjectX - this.viewportWidth * lead)));
  }
}
