export interface TextOptions {
  color?: string;
  font?: string;
  align?: CanvasTextAlign;
}

export class UIFramework {
  constructor(private readonly context: CanvasRenderingContext2D) {}

  panel(x: number, y: number, width: number, height: number, color = "rgba(0,0,0,.5)"): void {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, width, height);
  }

  text(value: string, x: number, y: number, options: TextOptions = {}): void {
    this.context.fillStyle = options.color ?? "#fff";
    this.context.font = options.font ?? "18px Arial";
    this.context.textAlign = options.align ?? "left";
    this.context.fillText(value, x, y);
  }
}
