import type { Scene } from "./Scene";

export class SceneManager {
  private readonly scenes = new Map<string, Scene>();
  private active?: Scene;

  register(id: string, scene: Scene): void {
    if (this.scenes.has(id)) throw new Error(`Scene already registered: ${id}`);
    this.scenes.set(id, scene);
  }

  start(id: string): void {
    const next = this.scenes.get(id);
    if (!next) throw new Error(`Unknown scene: ${id}`);
    if (next === this.active) return;
    this.active?.exit();
    this.active = next;
    this.active.enter();
  }

  update(deltaSeconds: number): void {
    this.active?.update(deltaSeconds);
  }

  render(interpolation: number): void {
    this.active?.render(interpolation);
  }

  dispose(): void {
    this.active?.exit();
    this.active = undefined;
    this.scenes.clear();
  }
}
