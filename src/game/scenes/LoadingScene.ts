import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { Scene } from "./Scene";

export class LoadingScene implements Scene {
  progress = 0;
  error?: string;

  constructor(
    private readonly state: GameStateManager,
    private readonly renderer: VisualUIRenderer,
  ) {}

  enter(): void {
    this.state.patch({ mode: "loading" });
  }

  exit(): void {}
  update(): void {}

  render(): void {
    this.renderer.loading(this.progress, this.error);
  }
}
