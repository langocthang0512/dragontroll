import { SpriteAnimator } from "../animation/SpriteAnimator";
import type { InputSystem } from "../input/InputSystem";
import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { LegacyGameplaySystem } from "../systems/LegacyGameplaySystem";
import { MenuListController } from "../ui/MenuListController";
import type { Scene } from "./Scene";

export class MainMenuScene implements Scene {
  private readonly menu = new MenuListController([
    { id: "start", label: "START" },
    { id: "shop", label: "SHOP" },
    { id: "settings", label: "SETTINGS" },
  ]);
  private readonly preview = new SpriteAnimator();

  constructor(
    private readonly input: InputSystem,
    private readonly gameplay: LegacyGameplaySystem,
    private readonly state: GameStateManager,
    private readonly renderer: VisualUIRenderer,
    private readonly navigate: (scene: string) => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "menu" });
    this.menu.reset();
    this.preview.setState("idle", true);
  }

  exit(): void {}

  update(deltaSeconds: number): void {
    this.preview.update(deltaSeconds);
    const action = this.menu.update(this.input);
    if (action === "start") {
      this.gameplay.loadLevel(this.state.snapshot.currentLevel);
      this.navigate("play");
    }
    if (action === "shop") this.navigate("shop");
    if (action === "settings") this.navigate("settings");
  }

  render(): void {
    this.renderer.mainMenu(this.menu.options, this.menu.selectedIndex, this.state.snapshot.selectedCharacter, this.preview);
  }
}
