import type { InputSystem } from "../input/InputSystem";
import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { PrototypeGameplaySystem } from "../systems/PrototypeGameplaySystem";
import { MenuListController } from "../ui/MenuListController";
import type { Scene } from "./Scene";

export class ShopScene implements Scene {
  private readonly menu = new MenuListController([
    { id: "buy", label: "BUY LIFE" },
    { id: "back", label: "BACK" },
  ]);
  private message = "";

  constructor(
    private readonly input: InputSystem,
    private readonly gameplay: PrototypeGameplaySystem,
    private readonly state: GameStateManager,
    private readonly renderer: VisualUIRenderer,
    private readonly navigate: (scene: string) => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "shop" });
    this.menu.reset();
    this.message = "";
  }

  exit(): void {}

  update(): void {
    if (this.input.consume("escape")) return this.navigate("menu");
    const action = this.menu.update(this.input);
    if (action === "back") this.navigate("menu");
    if (action === "buy") {
      const result = this.gameplay.purchaseLife();
      this.message = result === "purchased"
        ? "LIFE RESTORED"
        : result === "max-lives" ? "LIVES ALREADY FULL" : "NOT ENOUGH GOLD";
      this.state.patch({ message: this.message });
    }
  }

  render(): void {
    this.renderer.shop(
      this.menu.options,
      this.menu.selectedIndex,
      this.state.snapshot.lives,
      this.state.snapshot.gold,
      this.message,
    );
  }
}
