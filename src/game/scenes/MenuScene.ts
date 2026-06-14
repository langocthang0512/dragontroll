import type { InputSystem } from "../input/InputSystem";
import type { LegacyWorldRenderer } from "../rendering/LegacyWorldRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { LegacyGameplaySystem } from "../systems/LegacyGameplaySystem";
import type { Scene } from "./Scene";

export class MenuScene implements Scene {
  constructor(
    private readonly input: InputSystem,
    private readonly gameplay: LegacyGameplaySystem,
    private readonly state: GameStateManager,
    private readonly renderer: LegacyWorldRenderer,
    private readonly startPlaying: () => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "menu" });
  }

  exit(): void {}

  update(): void {
    if (this.input.consume("enter")) {
      this.gameplay.loadLevel(this.state.snapshot.currentLevel);
      this.startPlaying();
    } else if (this.input.consume("n")) {
      this.gameplay.newGame();
      this.startPlaying();
    }
  }

  render(): void {
    const level = this.gameplay.level;
    if (level) this.renderer.renderMenu(level, this.gameplay.player, this.state.snapshot);
  }
}
