import type { InputSystem } from "../input/InputSystem";
import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { Scene } from "./Scene";

export class PlaceholderScene implements Scene {
  constructor(
    private readonly input: InputSystem,
    private readonly renderer: VisualUIRenderer,
    private readonly title: string,
    private readonly message: string,
    private readonly returnTo: () => void,
  ) {}

  enter(): void {}
  exit(): void {}

  update(): void {
    if (this.input.consume("escape") || this.input.consume("enter")) this.returnTo();
  }

  render(): void {
    this.renderer.placeholder(this.title, this.message);
  }
}
