import type { InputSystem } from "../input/InputSystem";
import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { PrototypeGameplaySystem } from "../systems/PrototypeGameplaySystem";
import { MenuListController } from "../ui/MenuListController";
import type { Scene } from "./Scene";

export class VictoryScene implements Scene {
  private readonly menu = new MenuListController([
    { id: "menu", label: "RETURN MENU" },
    { id: "replay", label: "REPLAY MAP 1" },
  ]);

  constructor(
    private readonly input: InputSystem,
    private readonly gameplay: PrototypeGameplaySystem,
    private readonly state: GameStateManager,
    private readonly renderer: VisualUIRenderer,
    private readonly navigate: (scene: string) => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "victory", levelCleared: true });
    this.menu.reset();
  }

  exit(): void {}

  update(): void {
    const action = this.menu.update(this.input);
    if (action === "menu") {
      this.gameplay.restartRun();
      this.navigate("menu");
    }
    if (action === "replay") {
      this.gameplay.restartRun();
      this.navigate("play");
    }
  }

  render(): void {
    this.renderer.victory(this.menu.options, this.menu.selectedIndex, this.state.snapshot.gold, this.state.snapshot.deaths);
  }
}
