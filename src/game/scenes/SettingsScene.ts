import type { InputSystem } from "../input/InputSystem";
import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import { MenuListController } from "../ui/MenuListController";
import type { Scene } from "./Scene";

export class SettingsScene implements Scene {
  private readonly menu = new MenuListController([
    { id: "character", label: "CHARACTER" },
    { id: "maps", label: "MAPS  LOCKED", disabled: true },
    { id: "back", label: "BACK" },
  ]);

  constructor(
    private readonly input: InputSystem,
    private readonly state: GameStateManager,
    private readonly renderer: VisualUIRenderer,
    private readonly navigate: (scene: string) => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "settings" });
    this.menu.reset();
  }

  exit(): void {}

  update(): void {
    if (this.input.consume("escape")) return this.navigate("menu");
    const action = this.menu.update(this.input);
    if (action === "character") this.navigate("character");
    if (action === "back") this.navigate("menu");
  }

  render(): void {
    this.renderer.menu("SETTINGS", `CHARACTER  ${this.state.snapshot.selectedCharacter}`, this.menu.options, this.menu.selectedIndex, "MAP SELECTION ARRIVES IN A FUTURE MILESTONE");
  }
}
