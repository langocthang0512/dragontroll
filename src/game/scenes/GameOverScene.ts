import type { InputSystem } from "../input/InputSystem";
import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { PrototypeGameplaySystem } from "../systems/PrototypeGameplaySystem";
import { MenuListController } from "../ui/MenuListController";
import type { Scene } from "./Scene";

export class GameOverScene implements Scene {
  private readonly menu = new MenuListController([
    { id: "restart", label: "RESTART RUN" },
    { id: "menu", label: "RETURN MENU" },
  ]);

  constructor(
    private readonly input: InputSystem,
    private readonly gameplay: PrototypeGameplaySystem,
    private readonly state: GameStateManager,
    private readonly renderer: VisualUIRenderer,
    private readonly navigate: (scene: string) => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "gameOver", runFlow: "gameOver" });
    this.menu.reset();
  }

  exit(): void {}

  update(): void {
    const action = this.menu.update(this.input);
    if (action === "restart") {
      this.gameplay.restartRun();
      this.navigate("play");
    }
    if (action === "menu" || this.input.consume("escape")) this.navigate("menu");
  }

  render(): void {
    this.renderer.gameOver(this.menu.options, this.menu.selectedIndex, this.state.snapshot.gold);
  }
}
