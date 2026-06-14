export interface Scene {
  enter(): void;
  exit(): void;
  update(deltaSeconds: number): void;
  render(interpolation: number): void;
}
