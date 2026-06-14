import type { SpriteAnimator } from "../animation/SpriteAnimator";
import type { CharacterAnimationState, CharacterVariant } from "../animation/types";
import type { MenuOption } from "../ui/MenuListController";
import type { CanvasRenderer } from "./CanvasRenderer";
import type { CharacterRenderer } from "./CharacterRenderer";

export class VisualUIRenderer {
  constructor(
    private readonly renderer: CanvasRenderer,
    private readonly characters: CharacterRenderer,
  ) {}

  loading(progress: number, error?: string): void {
    this.backdrop();
    const { ui } = this.renderer;
    ui.pixelText("DRAGON TROLL ISLAND", 480, 184, 4, "#f0c35a", "center");
    ui.pixelText(error ? "ASSET LOAD FAILED" : "FORGING PIXELS", 480, 276, 2, error ? "#f05b61" : "#d9e2e8", "center");
    ui.progressBar(280, 314, 400, error ? 0 : progress);
    ui.pixelText(error ?? `${Math.round(progress * 100)} PERCENT`, 480, 358, 2, "#8fa8b8", "center");
  }

  menu(title: string, subtitle: string, options: readonly MenuOption[], selectedIndex: number, footer = "ARROWS TO MOVE   ENTER TO SELECT"): void {
    this.backdrop();
    const { ui } = this.renderer;
    ui.pixelText(title, 480, 76, 5, "#f0c35a", "center");
    ui.pixelText(subtitle, 480, 130, 2, "#8fa8b8", "center");
    ui.pixelPanel(310, 170, 340, 250, "#131e33", "#8a6c3d");
    options.forEach((option, index) => {
      ui.pixelButton(option.label, 350, 198 + index * 58, 260, index === selectedIndex, option.disabled);
    });
    ui.pixelText(footer, 480, 478, 2, "#8fa8b8", "center");
  }

  mainMenu(options: readonly MenuOption[], selectedIndex: number, variant: CharacterVariant, animator: SpriteAnimator): void {
    this.menu("DRAGON TROLL ISLAND", "MAP 1  LOST WORLD", options, selectedIndex);
    this.characters.render(variant, animator, 210, 400, 1, 2);
    this.drawPedestal(210, 408);
  }

  characterSelect(selected: CharacterVariant, state: CharacterAnimationState, male: SpriteAnimator, female: SpriteAnimator): void {
    this.backdrop();
    const { ui } = this.renderer;
    ui.pixelText("CHOOSE CHARACTER", 480, 64, 4, "#f0c35a", "center");
    ui.pixelText(`PREVIEW  ${state}`, 480, 112, 2, "#8fa8b8", "center");
    this.characterCard("MALE", "male", male, 170, selected === "male");
    this.characterCard("FEMALE", "female", female, 520, selected === "female");
    ui.pixelText("LEFT/RIGHT TO CHOOSE", 480, 458, 2, "#d9e2e8", "center");
    ui.pixelText("ENTER TO SAVE   ESC TO CANCEL", 480, 488, 2, "#8fa8b8", "center");
  }

  pause(options: readonly MenuOption[], selectedIndex: number): void {
    const context = this.renderer.context;
    context.fillStyle = "rgba(8,11,20,.74)";
    context.fillRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
    const { ui } = this.renderer;
    ui.pixelText("PAUSED", 480, 94, 5, "#f0c35a", "center");
    ui.pixelPanel(310, 160, 340, 250, "#131e33", "#8a6c3d");
    options.forEach((option, index) => ui.pixelButton(option.label, 350, 190 + index * 62, 260, index === selectedIndex));
    ui.pixelText("ESC TO RESUME", 480, 470, 2, "#8fa8b8", "center");
  }

  gameOver(options: readonly MenuOption[], selectedIndex: number, gold: number): void {
    this.backdrop();
    const { ui } = this.renderer;
    ui.pixelText("GAME OVER", 480, 92, 5, "#f05b61", "center");
    ui.pixelText(`RUN GOLD  ${gold}`, 480, 150, 2, "#f0c35a", "center");
    ui.pixelPanel(310, 190, 340, 180, "#131e33", "#8a6c3d");
    options.forEach((option, index) => ui.pixelButton(option.label, 350, 220 + index * 64, 260, index === selectedIndex));
    ui.pixelText("GOLD IS KEPT FOR THE SHOP", 480, 430, 2, "#8fa8b8", "center");
  }

  shop(options: readonly MenuOption[], selectedIndex: number, lives: number, gold: number, message: string): void {
    this.backdrop();
    const { ui, context } = this.renderer;
    ui.pixelText("JUNGLE OUTPOST", 480, 72, 5, "#f0c35a", "center");
    ui.pixelText("BASIC SHOP", 480, 126, 2, "#8fa8b8", "center");
    ui.pixelPanel(180, 166, 250, 230, "#131e33", "#8a6c3d");
    this.drawHeart(305, 226, 3);
    ui.pixelText("ONE LIFE", 305, 300, 3, "#f5f1dc", "center");
    ui.pixelText("50 GOLD", 305, 338, 2, "#f0c35a", "center");
    ui.pixelPanel(500, 166, 280, 230, "#131e33", "#8a6c3d");
    options.forEach((option, index) => ui.pixelButton(option.label, 530, 210 + index * 64, 220, index === selectedIndex));
    ui.pixelText(`LIVES ${lives} OF 3`, 640, 344, 2, "#d9e2e8", "center");
    ui.pixelText(`WALLET ${gold}`, 640, 370, 2, "#f0c35a", "center");
    if (message) ui.pixelText(message, 480, 438, 2, "#82c59d", "center");
    ui.pixelText("ENTER TO BUY   ESC TO RETURN", 480, 482, 2, "#8fa8b8", "center");
    context.fillStyle = "#25344d";
    context.fillRect(206, 188, 198, 4);
  }

  victory(options: readonly MenuOption[], selectedIndex: number, gold: number, deaths: number): void {
    this.backdrop();
    const { ui } = this.renderer;
    ui.pixelText("LOST WORLD CLEARED", 480, 76, 4, "#82c59d", "center");
    ui.pixelText("THE ANCIENT GATE IS AWAKE", 480, 128, 2, "#f0c35a", "center");
    ui.pixelPanel(250, 166, 460, 92, "#131e33", "#8a6c3d");
    ui.pixelText(`GOLD ${gold}`, 350, 202, 3, "#f0c35a", "center");
    ui.pixelText(`FALLS ${deaths}`, 610, 202, 3, "#d9e2e8", "center");
    ui.pixelPanel(310, 286, 340, 150, "#131e33", "#8a6c3d");
    options.forEach((option, index) => ui.pixelButton(option.label, 350, 308 + index * 58, 260, index === selectedIndex));
    ui.pixelText("NEXT MAP UNLOCK PLACEHOLDER SAVED", 480, 474, 2, "#8fa8b8", "center");
  }

  placeholder(title: string, message: string): void {
    this.backdrop();
    const { ui } = this.renderer;
    ui.pixelText(title, 480, 120, 5, "#f0c35a", "center");
    ui.pixelPanel(230, 210, 500, 150, "#131e33", "#8a6c3d");
    ui.pixelText(message, 480, 258, 2, "#d9e2e8", "center");
    ui.pixelText("PRESS ESC OR ENTER TO RETURN", 480, 318, 2, "#8fa8b8", "center");
  }

  private characterCard(label: string, variant: CharacterVariant, animator: SpriteAnimator, x: number, selected: boolean): void {
    const { ui } = this.renderer;
    ui.pixelPanel(x, 150, 270, 260, selected ? "#20364d" : "#131e33", selected ? "#f0c35a" : "#718096");
    this.characters.render(variant, animator, x + 135, 344, 1, 2.4);
    this.drawPedestal(x + 135, 352);
    ui.pixelText(label, x + 135, 374, 3, selected ? "#f0c35a" : "#d9e2e8", "center");
  }

  private drawPedestal(x: number, y: number): void {
    const context = this.renderer.context;
    context.fillStyle = "#0b1020";
    context.fillRect(x - 60, y, 120, 10);
    context.fillStyle = "#526579";
    context.fillRect(x - 52, y - 4, 104, 8);
    context.fillStyle = "#8fa8b8";
    context.fillRect(x - 44, y - 4, 88, 3);
  }

  private drawHeart(x: number, y: number, scale: number): void {
    const context = this.renderer.context;
    context.fillStyle = "#701f32";
    context.fillRect(x - 8 * scale, y - 5 * scale, 16 * scale, 11 * scale);
    context.fillRect(x - 5 * scale, y + 6 * scale, 10 * scale, 4 * scale);
    context.fillStyle = "#e94f64";
    context.fillRect(x - 7 * scale, y - 4 * scale, 6 * scale, 8 * scale);
    context.fillRect(x + scale, y - 4 * scale, 6 * scale, 8 * scale);
    context.fillRect(x - 5 * scale, y + 4 * scale, 10 * scale, 3 * scale);
    context.fillStyle = "#ff91a0";
    context.fillRect(x - 5 * scale, y - 3 * scale, 2 * scale, 2 * scale);
  }

  private backdrop(): void {
    const context = this.renderer.context;
    context.fillStyle = "#0c1324";
    context.fillRect(0, 0, 960, 540);
    context.fillStyle = "#13213a";
    context.fillRect(0, 280, 960, 260);
    context.fillStyle = "#1b3049";
    for (let x = -40; x < 1000; x += 96) {
      const height = 64 + ((x / 96) % 3) * 18;
      context.fillRect(x, 280 - height, 70, height);
      context.fillRect(x + 18, 280 - height - 18, 34, 18);
    }
    context.fillStyle = "#8fa8b8";
    for (const [x, y] of [[80, 62], [146, 118], [820, 84], [744, 146], [906, 202], [48, 218]]) context.fillRect(x, y, 4, 4);
    context.fillStyle = "#0a0f1c";
    context.fillRect(0, 500, 960, 40);
    context.fillStyle = "#263950";
    for (let x = 0; x < 960; x += 32) context.fillRect(x, 500, 28, 4);
  }
}
