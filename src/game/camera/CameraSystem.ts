export class CameraSystem {
  x = 0;

  constructor(private readonly viewportWidth: number) {}

  follow(targetX: number, worldWidth: number, lead = 0.42): void {
    this.x = Math.max(0, Math.min(worldWidth - this.viewportWidth, targetX - this.viewportWidth * lead));
  }

  reset(): void {
    this.x = 0;
  }
}
