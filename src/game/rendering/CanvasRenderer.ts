import { UIFramework } from "../ui/UIFramework";

export class CanvasRenderer {
  readonly context: CanvasRenderingContext2D;
  readonly ui: UIFramework;

  constructor(readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is not supported by this browser.");
    context.imageSmoothingEnabled = false;
    this.context = context;
    this.ui = new UIFramework(context);
  }

  clear(color = "#0d0d16"): void {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
