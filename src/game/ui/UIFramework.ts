import { PixelFont } from "./PixelFont";

export interface TextOptions {
  color?: string;
  font?: string;
  align?: CanvasTextAlign;
}

export class UIFramework {
  private readonly pixelFont: PixelFont;

  constructor(private readonly context: CanvasRenderingContext2D) {
    this.pixelFont = new PixelFont(context);
  }

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

  pixelText(value: string, x: number, y: number, scale = 2, color = "#f5f1dc", align: CanvasTextAlign = "left"): void {
    this.pixelFont.draw(value, x, y, scale, color, align);
  }

  pixelPanel(x: number, y: number, width: number, height: number, fill = "#182238", border = "#d6b35a"): void {
    this.context.fillStyle = "rgba(4,10,18,.65)";
    this.context.fillRect(x + 5, y + 6, width, height);
    this.context.fillStyle = border;
    this.context.fillRect(x, y, width, height);
    this.context.fillStyle = "#273c43";
    this.context.fillRect(x + 2, y + 2, width - 4, height - 4);
    this.context.fillStyle = "#8d7642";
    this.context.fillRect(x + 4, y + 4, width - 8, 2);
    this.context.fillRect(x + 4, y + height - 6, width - 8, 2);
    this.context.fillStyle = fill;
    this.context.fillRect(x + 7, y + 7, width - 14, height - 14);
    this.context.fillStyle = border;
    this.context.fillRect(x + 3, y + 3, 4, 4);
    this.context.fillRect(x + width - 7, y + 3, 4, 4);
    this.context.fillRect(x + 3, y + height - 7, 4, 4);
    this.context.fillRect(x + width - 7, y + height - 7, 4, 4);
  }

  pixelButton(label: string, x: number, y: number, width: number, selected: boolean, disabled = false): void {
    const fill = disabled ? "#252a39" : selected ? "#31584f" : "#18343c";
    const border = disabled ? "#555a66" : selected ? "#f0c35a" : "#6f8f7a";
    this.pixelPanel(x, y, width, 42, fill, border);
    if (selected && !disabled) {
      this.context.fillStyle = "#f0c35a";
      this.context.fillRect(x - 14, y + 15, 8, 8);
      this.context.fillRect(x - 10, y + 12, 4, 14);
      this.context.fillStyle = "rgba(240,195,90,.18)";
      this.context.fillRect(x + 8, y + 8, width - 16, 26);
    }
    this.pixelText(label, x + width / 2, y + 14, 2, disabled ? "#777c88" : "#f5f1dc", "center");
  }

  progressBar(x: number, y: number, width: number, value: number): void {
    this.pixelPanel(x, y, width, 24, "#101827", "#718096");
    const innerWidth = Math.round((width - 16) * Math.max(0, Math.min(1, value)));
    this.context.fillStyle = "#4d8f78";
    this.context.fillRect(x + 8, y + 8, innerWidth, 8);
    this.context.fillStyle = "#82c59d";
    this.context.fillRect(x + 8, y + 8, innerWidth, 3);
  }
}
