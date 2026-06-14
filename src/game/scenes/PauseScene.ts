import type { InputSystem } from "../input/InputSystem";
import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { LegacyGameplaySystem } from "../systems/LegacyGameplaySystem";
import { MenuListController } from "../ui/MenuListController";
import type { Scene } from "./Scene";

export class PauseScene implements Scene {
  private readonly menu = new MenuListController([
    { id: "resume", label: "RESUME" },
    { id: "restart", label: "RESTART" },
    { id: "exit", label: "EXIT" },
  ]);

  constructor(
    private readonly input: InputSystem,
    private readonly gameplay: LegacyGameplaySystem,
    private readonly state: GameStateManager,
    private readonly renderer: VisualUIRenderer,
    private readonly renderGame: () => void,
    private readonly navigate: (scene: string) => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "paused" });
    this.menu.reset();
  }

  exit(): void {}

  update(): void {
    if (this.input.consume("escape")) return this.navigate("play");
    const action = this.menu.update(this.input);
    if (action === "resume") this.navigate("play");
    if (action === "restart") {
      this.gameplay.restartLevel();
      this.navigate("play");
    }
    if (action === "exit") this.navigate("menu");
  }

  render(): void {
    this.renderGame();
    this.renderer.pause(this.menu.options, this.menu.selectedIndex);
  }
}
