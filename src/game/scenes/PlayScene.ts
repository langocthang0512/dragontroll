import type { InputSystem } from "../input/InputSystem";
import type { MapLoader } from "../maps/MapLoader";
import type { LegacyWorldRenderer } from "../rendering/LegacyWorldRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { LegacyGameplaySystem } from "../systems/LegacyGameplaySystem";
import type { Scene } from "./Scene";

export class PlayScene implements Scene {
  constructor(
    private readonly input: InputSystem,
    private readonly maps: MapLoader,
    private readonly gameplay: LegacyGameplaySystem,
    private readonly state: GameStateManager,
    private readonly renderer: LegacyWorldRenderer,
    private readonly openMenu: () => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "playing" });
  }

  exit(): void {}

  update(): void {
    if (this.input.consume("escape")) {
      this.openMenu();
      return;
    }

    if (this.state.snapshot.levelCleared) {
      const finalLevel = this.state.snapshot.currentLevel === this.maps.count - 1;
      if (!finalLevel && this.input.consume("enter")) this.gameplay.advanceLevel();
      if (finalLevel && this.input.consume("r")) this.gameplay.newGame();
      return;
    }

    this.gameplay.update();
  }

  render(): void {
    const level = this.gameplay.level;
    if (level) this.renderer.renderWorld(level, this.gameplay.player, this.state.snapshot, this.gameplay.camera.x);
  }
}
