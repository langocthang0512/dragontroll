import type { SpriteAnimator } from "../animation/SpriteAnimator";
import type { AssetLoader } from "../assets/AssetLoader";
import { LOST_WORLD_BACKGROUND } from "../assets/manifest";
import type { EnemyEntity, EnvironmentDecoration, FallingHazard } from "../gameplay/types";
import type { PrototypeGameplaySystem } from "../systems/PrototypeGameplaySystem";
import type { GameState } from "../state/GameStateManager";
import type { CanvasRenderer } from "./CanvasRenderer";
import type { CharacterRenderer } from "./CharacterRenderer";

export const PAUSE_BUTTON = { x: 896, y: 14, w: 50, h: 42 } as const;

const TUTORIAL_STONES = [
  { x: 150, label: "MOVE  A D" },
  { x: 760, label: "JUMP  SPACE" },
  { x: 1510, label: "SWORD  J X" },
] as const;

export class PrototypeWorldRenderer {
  constructor(
    private readonly renderer: CanvasRenderer,
    private readonly characters: CharacterRenderer,
    private readonly assets: AssetLoader,
  ) {}

  render(gameplay: PrototypeGameplaySystem, state: Readonly<GameState>, animator: SpriteAnimator): void {
    const { context } = this.renderer;
    const { area, camera } = gameplay;
    const time = performance.now() / 1000;
    this.drawBackground(camera.x, time);
    context.save();
    context.translate(-camera.x, 0);

    for (const decoration of area.decorations) {
      if (this.visible(decoration.x - 180, 360, camera.x)) this.drawDecoration(decoration);
    }
    this.drawTutorialStones(camera.x);
    for (const platform of area.platforms) {
      if (this.visible(platform.x, platform.w, camera.x)) this.drawPlatform(platform.x, platform.y, platform.w, platform.h);
    }
    for (const pickup of area.gold) {
      if (!pickup.collected && this.visible(pickup.x, pickup.w, camera.x)) this.drawGold(pickup.x, pickup.y, time, pickup.id);
    }
    for (const checkpoint of area.checkpoints) {
      if (!this.visible(checkpoint.x, checkpoint.w, camera.x)) continue;
      this.drawCheckpoint(checkpoint.x, checkpoint.y, gameplay.checkpoints.isActive(area.id, checkpoint.id), gameplay.checkpointPulse, time);
    }
    for (const hazard of area.hazards) {
      if (this.visible(hazard.x - 30, hazard.w + 60, camera.x)) this.drawHazard(hazard, time);
    }
    for (const spike of area.spikes) {
      if (this.visible(spike.x, spike.w, camera.x)) this.drawSpikes(spike.x, spike.y, spike.w);
    }
    for (const enemy of area.enemies) {
      if (enemy.alive && this.visible(enemy.x, enemy.w, camera.x)) this.drawEnemy(enemy, time);
    }
    if (this.visible(area.goal.x, area.goal.w, camera.x)) this.drawGoal(area.goal.x, area.goal.y);

    if (gameplay.landingPulse > 0) {
      context.fillStyle = "rgba(203,240,194,.72)";
      context.fillRect(gameplay.player.x - 5, gameplay.player.y + gameplay.player.h + 2, gameplay.player.w + 10, 3);
    }
    context.restore();

    this.characters.render(
      state.selectedCharacter,
      animator,
      gameplay.player.x + gameplay.player.w / 2 - camera.x,
      gameplay.player.y + gameplay.player.h,
      gameplay.player.face,
      1.08,
    );
    this.drawForeground(camera.x, time);
    this.drawHud(state, gameplay.currentSection.label, gameplay.player.x / (area.width - gameplay.player.w));
  }

  private drawBackground(cameraX: number, time: number): void {
    const { context } = this.renderer;
    const background = this.assets.get<HTMLImageElement>(LOST_WORLD_BACKGROUND);
    const drift = Math.round(Math.min(50, cameraX / 140));
    context.imageSmoothingEnabled = false;
    context.drawImage(background, -drift, 0, 1010, 540);
    context.fillStyle = "rgba(4,24,29,.18)";
    context.fillRect(0, 300, 960, 240);

    context.fillStyle = "rgba(214,235,193,.15)";
    const mistOffset = Math.round(Math.sin(time * 0.35) * 12);
    for (let x = -120; x < 1080; x += 180) {
      context.fillRect(x + mistOffset, 366 + (x % 4) * 5, 146, 8);
      context.fillRect(x + 32 + mistOffset, 374 + (x % 3) * 4, 94, 5);
    }

    context.fillStyle = "rgba(8,35,39,.62)";
    context.fillRect(0, 410, 960, 130);
  }

  private drawForeground(cameraX: number, time: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#0d292f";
    for (let index = 0; index < 13; index++) {
      const x = this.wrap(index * 91 - cameraX * 0.48, 1180) - 100;
      const height = 18 + (index % 3) * 9;
      context.fillRect(x, 540 - height, 72, height);
      context.fillRect(x + 16, 528 - height, 38, 14);
      context.fillStyle = "#16403a";
      context.fillRect(x + 8, 535 - height, 18, 7);
      context.fillRect(x + 46, 532 - height, 14, 9);
      context.fillStyle = "#0d292f";
    }
    context.fillStyle = "#18433f";
    context.fillRect(0, 532, 960, 8);
    context.fillStyle = "rgba(206,231,178,.14)";
    for (let x = 20; x < 960; x += 95) {
      const y = 480 + Math.round(Math.sin(time * 1.2 + x) * 4);
      context.fillRect(x, y, 3, 3);
    }
  }

  private drawPlatform(x: number, y: number, width: number, height: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#101f27";
    context.fillRect(x, y, width, height);
    context.fillStyle = "#29443f";
    context.fillRect(x + 3, y + 10, width - 6, Math.max(4, height - 10));
    context.fillStyle = "#4e6758";
    context.fillRect(x, y + 4, width, 8);
    context.fillStyle = "#76945f";
    context.fillRect(x, y, width, 6);
    context.fillStyle = "#bbcf78";
    context.fillRect(x + 2, y, width - 4, 2);
    for (let px = x + 8; px < x + width - 6; px += 28) {
      context.fillStyle = px % 3 ? "#3b5550" : "#45605a";
      context.fillRect(px, y + 14, 24, Math.min(17, height - 14));
      context.fillStyle = "#1c3538";
      context.fillRect(px + 17, y + 16, 3, 9);
      context.fillRect(px + 5, y + 25, 12, 3);
      context.fillStyle = "#6f875e";
      context.fillRect(px + 2, y + 11, 13, 3);
      if (height > 24 && px % 2 === 0) {
        context.fillStyle = "#6e985c";
        context.fillRect(px + 3, y + 6, 4, 17);
        context.fillRect(px + 1, y + 19, 8, 3);
      }
    }
    context.fillStyle = "#86a860";
    for (let px = x + 8; px < x + width - 8; px += 37) context.fillRect(px, y - 3 - (px % 2) * 2, 14, 4);
  }

  private drawDecoration(decoration: EnvironmentDecoration): void {
    const { context } = this.renderer;
    const { x, y, scale } = decoration;
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    if (decoration.kind === "tree") {
      context.fillStyle = "#102d31";
      context.fillRect(-13, -166, 27, 166);
      context.fillRect(-38, -119, 28, 9);
      context.fillRect(11, -92, 35, 9);
      context.fillRect(-29, -113, 8, 42);
      context.fillRect(35, -86, 7, 38);
      context.fillStyle = "#275046";
      context.fillRect(-8, -162, 9, 154);
      context.fillRect(-36, -118, 26, 5);
      context.fillStyle = "#4e8158";
      context.fillRect(-15, -169, 18, 9);
      context.fillRect(-41, -124, 18, 8);
      context.fillRect(31, -98, 18, 8);
      context.fillStyle = "#6b995d";
      context.fillRect(-19, -151, 4, 72);
      context.fillRect(20, -107, 4, 61);
      for (let py = -142; py < -80; py += 18) context.fillRect(-27, py, 10, 4);
      for (let py = -98; py < -43; py += 17) context.fillRect(22, py, 11, 4);
      context.fillRect(-25, -10, 18, 8);
      context.fillRect(8, -12, 24, 9);
    } else if (decoration.kind === "ruin") {
      context.fillStyle = "#1b3439";
      context.fillRect(-56, -116, 32, 116);
      context.fillRect(22, -96, 34, 96);
      context.fillRect(-66, -128, 52, 14);
      context.fillRect(12, -108, 56, 14);
      context.fillStyle = "#3d5a55";
      context.fillRect(-50, -108, 20, 102);
      context.fillRect(29, -88, 20, 82);
      context.fillStyle = "#71806b";
      context.fillRect(-46, -104, 7, 31);
      context.fillRect(34, -84, 7, 24);
      context.fillRect(-61, -124, 42, 4);
      context.fillRect(18, -104, 43, 4);
      context.fillStyle = "#203d3f";
      context.fillRect(-43, -62, 11, 4);
      context.fillRect(-48, -37, 9, 17);
      context.fillRect(34, -49, 10, 4);
      context.fillStyle = "#709b58";
      context.fillRect(-56, -130, 35, 6);
      context.fillRect(-54, -126, 7, 31);
      context.fillRect(18, -110, 32, 6);
      context.fillStyle = "#a9bc72";
      context.fillRect(-50, -130, 18, 3);
    } else if (decoration.kind === "idol") {
      context.fillStyle = "#253f43";
      context.fillRect(-24, -70, 48, 70);
      context.fillRect(-34, -8, 68, 8);
      context.fillStyle = "#6c846d";
      context.fillRect(-17, -56, 12, 12);
      context.fillRect(7, -56, 12, 12);
      context.fillRect(-10, -32, 20, 7);
      context.fillStyle = "#d5c56e";
      context.fillRect(-13, -52, 5, 5);
      context.fillRect(10, -52, 5, 5);
      context.fillStyle = "#8da664";
      context.fillRect(-29, -75, 24, 6);
      context.fillRect(10, -73, 22, 6);
      context.fillRect(-31, -25, 7, 23);
      context.fillStyle = "#b7c676";
      context.fillRect(-24, -74, 10, 3);
    } else if (decoration.kind === "vine") {
      context.fillStyle = "#2c684d";
      context.fillRect(-3, 0, 6, 170);
      for (let py = 20; py < 165; py += 28) {
        context.fillRect(-14, py, 13, 6);
        context.fillRect(3, py + 10, 14, 6);
      }
    } else if (decoration.kind === "flower") {
      context.fillStyle = "#2c684d";
      context.fillRect(-2, -28, 4, 28);
      context.fillStyle = "#ef6d72";
      context.fillRect(-10, -38, 20, 12);
      context.fillStyle = "#f4cf67";
      context.fillRect(-3, -34, 6, 6);
    } else {
      context.fillStyle = "rgba(91,173,173,.45)";
      context.fillRect(-27, -224, 54, 224);
      context.fillStyle = "#68b8b3";
      context.fillRect(-22, -220, 44, 220);
      context.fillStyle = "#b3e8d8";
      context.fillRect(-15, -220, 8, 205);
      context.fillRect(7, -204, 6, 187);
      context.fillStyle = "#d9f0dc";
      context.fillRect(-13, -216, 3, 126);
      context.fillStyle = "#2b6c69";
      context.fillRect(-36, -8, 72, 8);
      context.fillStyle = "#78bbb0";
      context.fillRect(-27, -14, 54, 6);
    }
    context.restore();
  }

  private drawTutorialStones(cameraX: number): void {
    for (const stone of TUTORIAL_STONES) {
      if (!this.visible(stone.x, 128, cameraX)) continue;
      const { context, ui } = this.renderer;
      context.fillStyle = "#233d42";
      context.fillRect(stone.x, 448, 128, 38);
      context.fillStyle = "#6c846d";
      context.fillRect(stone.x + 5, 443, 118, 36);
      context.fillStyle = "#38574f";
      context.fillRect(stone.x + 10, 448, 108, 26);
      ui.pixelText(stone.label, stone.x + 64, 457, 1, "#e6e3bd", "center");
    }
  }

  private drawCheckpoint(x: number, y: number, active: boolean, pulse: number, time: number): void {
    const { context } = this.renderer;
    const glow = active ? 0.18 + Math.sin(time * 4) * 0.06 : 0;
    if (active) {
      context.fillStyle = `rgba(145,255,191,${glow + pulse * 0.12})`;
      context.fillRect(x - 14, y - 14, 70, 92);
    }
    context.fillStyle = "#11232a";
    context.fillRect(x - 8, y + 10, 58, 56);
    context.fillStyle = "#2c4c49";
    context.fillRect(x - 3, y + 5, 48, 61);
    context.fillStyle = "#587060";
    context.fillRect(x + 2, y, 38, 8);
    context.fillRect(x + 2, y + 9, 7, 49);
    context.fillRect(x + 33, y + 9, 7, 49);
    context.fillStyle = "#8da178";
    context.fillRect(x + 7, y + 3, 28, 3);
    context.fillRect(x + 6, y + 12, 3, 34);
    context.fillStyle = "#152e32";
    context.fillRect(x + 10, y + 12, 22, 46);
    context.fillStyle = active ? "#55b88e" : "#3d655d";
    context.fillRect(x + 13, y + 15, 16, 40);
    context.fillStyle = active ? "#d8f09b" : "#75917a";
    context.fillRect(x + 19, y + 22, 5, 20);
    context.fillRect(x + 15, y + 29, 13, 5);
    context.fillStyle = active ? "#ffe17b" : "#876e42";
    context.fillRect(x + 26, y + 43, 4, 4);
    context.fillStyle = "#669358";
    context.fillRect(x - 5, y + 1, 5, 28);
    context.fillRect(x + 40, y + 14, 5, 35);
    context.fillRect(x - 9, y + 54, 18, 5);
    context.fillStyle = "#a7c16e";
    context.fillRect(x - 6, y + 1, 3, 12);
  }

  private drawGold(x: number, y: number, time: number, id: string): void {
    const { context } = this.renderer;
    const phase = time * 5 + this.hash(id);
    const width = 8 + Math.round(Math.abs(Math.sin(phase)) * 12);
    const bob = Math.round(Math.sin(phase * 0.65) * 3);
    const left = x + 10 - width / 2;
    context.fillStyle = "rgba(255,222,101,.18)";
    context.fillRect(x - 5, y - 5 + bob, 30, 30);
    context.fillStyle = "#7b461d";
    context.fillRect(left - 2, y + 2 + bob, width + 4, 17);
    context.fillStyle = "#d88a28";
    context.fillRect(left, y + bob, width, 19);
    context.fillStyle = "#ffcd48";
    context.fillRect(left + 2, y + 2 + bob, Math.max(2, width - 4), 15);
    context.fillStyle = "#fff1a0";
    context.fillRect(left + 3, y + 3 + bob, Math.max(2, width / 3), 3);
    context.fillStyle = "#bd5d24";
    context.fillRect(x + 8, y + 7 + bob, 4, 7);
    context.fillStyle = "#fff8c5";
    context.fillRect(x + 9, y + 6 + bob, 2, 2);
  }

  private drawEnemy(enemy: EnemyEntity, time: number): void {
    const { context } = this.renderer;
    const variant = this.hash(enemy.id) % 3;
    const palettes = [
      ["#183c36", "#2f7554", "#62a66b", "#e1bd58"],
      ["#302541", "#66416c", "#a15a78", "#f1a65d"],
      ["#4a241e", "#9a3d2e", "#d56a36", "#f3cb68"],
    ] as const;
    const [shadow, body, light, crest] = palettes[variant]!;
    const bob = Math.round(Math.sin(time * 5 + this.hash(enemy.id)) * 2);
    const step = Math.sin(time * 8 + this.hash(enemy.id)) > 0 ? 2 : -1;
    context.save();
    context.translate(Math.round(enemy.x + enemy.w / 2), Math.round(enemy.y + enemy.h + bob));
    context.scale(enemy.direction * 1.2, 1.2);
    context.fillStyle = "rgba(4,16,18,.32)";
    context.fillRect(-21, -3, 45, 5);
    context.fillStyle = enemy.flashRemaining > 0 ? "#fff7df" : shadow;
    context.fillRect(-15, -29, 29, 23);
    context.fillRect(7, -35, 17, 17);
    context.fillRect(-25, -19, 13, 9);
    context.fillRect(-28, -15, 7, 6);
    context.fillStyle = enemy.flashRemaining > 0 ? "#ffffff" : body;
    context.fillRect(-12, -32, 23, 22);
    context.fillRect(8, -38, 14, 16);
    context.fillRect(-22, -21, 11, 7);
    context.fillStyle = light;
    context.fillRect(-9, -30, 9, 5);
    context.fillRect(10, -36, 8, 5);
    context.fillRect(-7, -21, 5, 4);
    context.fillStyle = crest;
    context.fillRect(-8, -37, 5, 6);
    context.fillRect(-1, -40, 5, 8);
    context.fillRect(6, -41, 5, 7);
    context.fillRect(13, -42, 4, 5);
    context.fillStyle = "#eadb9f";
    context.fillRect(16, -33, 4, 3);
    context.fillStyle = "#111820";
    context.fillRect(17, -34, 2, 2);
    context.fillStyle = "#d8b06e";
    context.fillRect(20, -27, 8, 5);
    context.fillStyle = shadow;
    context.fillRect(-11 + step, -8, 7, 8);
    context.fillRect(6 - step, -8, 7, 8);
    context.fillStyle = crest;
    context.fillRect(-10 + step, -5, 5, 3);
    context.fillRect(7 - step, -5, 5, 3);
    context.restore();
  }

  private drawSpikes(x: number, y: number, width: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#172229";
    context.fillRect(x - 3, y + 12, width + 6, 6);
    context.fillStyle = "#43515a";
    context.fillRect(x, y + 10, width, 7);
    for (let px = x + 2; px < x + width - 8; px += 14) {
      context.fillStyle = "#8d9aa0";
      context.beginPath();
      context.moveTo(px, y + 12);
      context.lineTo(px + 7, y - 2);
      context.lineTo(px + 14, y + 12);
      context.fill();
      context.fillStyle = "#e8dfbe";
      context.fillRect(px + 6, y + 1, 2, 5);
      context.fillStyle = "#a6473f";
      context.fillRect(px + 4, y + 10, 6, 3);
    }
  }

  private drawHazard(hazard: FallingHazard, time: number): void {
    const { context } = this.renderer;
    if (hazard.state === "telegraph") {
      const pulse = 0.18 + Math.abs(Math.sin(time * 10)) * 0.18;
      context.fillStyle = `rgba(255,198,79,${pulse})`;
      context.fillRect(hazard.x - 10, 120, hazard.w + 20, hazard.resetY - 120);
      context.fillStyle = "#ffca54";
      context.fillRect(hazard.x - 5, 472, hazard.w + 10, 5);
      context.fillRect(hazard.x + 8, 462, 12, 5);
    }
    const wobble = hazard.state === "telegraph" ? Math.round(Math.sin(time * 18) * 2) : 0;
    const x = hazard.x + wobble;
    context.fillStyle = "#251d39";
    context.fillRect(x + 5, hazard.y, 18, 36);
    context.fillRect(x, hazard.y + 10, 28, 18);
    context.fillStyle = "#6e3d67";
    context.fillRect(x + 5, hazard.y + 4, 18, 26);
    context.fillStyle = "#c47a69";
    context.fillRect(x + 8, hazard.y + 5, 7, 9);
    context.fillRect(x + 15, hazard.y + 17, 7, 10);
    context.fillStyle = "#efd590";
    context.fillRect(x + 10, hazard.y + 4, 5, 4);
    context.fillRect(x + 6, hazard.y + 17, 5, 7);
    context.fillStyle = "#e44e65";
    context.fillRect(x + 13, hazard.y + 11, 5, 6);
    context.fillRect(x + 18, hazard.y + 24, 4, 5);
    context.fillStyle = "#ffb66e";
    context.fillRect(x + 14, hazard.y + 12, 2, 2);
  }

  private drawGoal(x: number, y: number): void {
    const { context } = this.renderer;
    context.fillStyle = "rgba(166,235,151,.2)";
    context.fillRect(x - 22, y - 24, 122, 116);
    context.fillStyle = "#10252b";
    context.fillRect(x - 5, y + 18, 88, 68);
    context.fillStyle = "#294843";
    context.fillRect(x, y + 12, 78, 74);
    context.fillStyle = "#536b5d";
    context.fillRect(x + 6, y + 7, 66, 8);
    context.fillRect(x + 5, y + 16, 10, 63);
    context.fillRect(x + 63, y + 16, 10, 63);
    context.fillStyle = "#879773";
    context.fillRect(x + 12, y + 2, 54, 9);
    context.fillRect(x + 20, y - 5, 38, 9);
    context.fillRect(x + 28, y - 11, 22, 8);
    context.fillStyle = "#b2bd80";
    context.fillRect(x + 26, y - 8, 26, 3);
    context.fillStyle = "#153437";
    context.fillRect(x + 19, y + 22, 40, 64);
    context.fillStyle = "#2c6657";
    context.fillRect(x + 23, y + 26, 32, 56);
    context.fillStyle = "#83c875";
    context.fillRect(x + 35, y + 33, 8, 34);
    context.fillRect(x + 27, y + 46, 24, 8);
    context.fillStyle = "#d9ed8c";
    context.fillRect(x + 38, y + 40, 3, 20);
    context.fillRect(x + 32, y + 49, 15, 3);
    context.fillStyle = "#f4ce62";
    context.fillRect(x + 37, y + 45, 5, 11);
    context.fillStyle = "#5f8f52";
    context.fillRect(x - 5, y + 4, 7, 35);
    context.fillRect(x + 75, y + 22, 7, 42);
    context.fillRect(x - 10, y + 68, 25, 7);
    context.fillRect(x + 61, y + 70, 27, 7);
    context.fillStyle = "#9bbd69";
    context.fillRect(x - 4, y + 3, 3, 16);
  }

  private drawHud(state: Readonly<GameState>, section: string, progress: number): void {
    const { ui, context } = this.renderer;
    ui.pixelPanel(12, 12, 300, 66, "rgba(15,37,43,.94)", "#82926e");
    for (let index = 0; index < 3; index++) this.drawHeart(30 + index * 30, 29, index < state.lives);
    ui.pixelText(`GOLD ${state.gold}`, 130, 28, 2, "#f3d56b");
    ui.pixelText(section, 24, 56, 1, "#d9e6c5");
    ui.pixelPanel(330, 12, 546, 42, "rgba(15,37,43,.94)", "#82926e");
    context.fillStyle = "#28474a";
    context.fillRect(344, 29, 518, 8);
    context.fillStyle = "#8fbc72";
    context.fillRect(344, 29, Math.max(4, Math.round(518 * Math.max(0, Math.min(1, progress)))), 8);
    context.fillStyle = "#d5e3b1";
    context.fillRect(344, 29, Math.max(4, Math.round(518 * Math.max(0, Math.min(1, progress)))), 3);
    ui.pixelPanel(PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.w, PAUSE_BUTTON.h, "#203d42", "#f0c35a");
    context.fillStyle = "#f5f1dc";
    context.fillRect(PAUSE_BUTTON.x + 16, PAUSE_BUTTON.y + 13, 5, 16);
    context.fillRect(PAUSE_BUTTON.x + 29, PAUSE_BUTTON.y + 13, 5, 16);
    if (state.message) ui.pixelText(state.message, 480, 92, 2, "#f5f1dc", "center");
  }

  private drawHeart(x: number, y: number, filled: boolean): void {
    const { context } = this.renderer;
    context.fillStyle = filled ? "#e94f64" : "#3c4a4c";
    context.fillRect(x, y, 8, 8);
    context.fillRect(x + 12, y, 8, 8);
    context.fillRect(x - 2, y + 4, 24, 8);
    context.fillRect(x + 2, y + 12, 16, 5);
    context.fillRect(x + 6, y + 17, 8, 4);
    if (filled) {
      context.fillStyle = "#ff9aa5";
      context.fillRect(x + 2, y + 2, 4, 4);
    }
  }

  private visible(x: number, width: number, cameraX: number): boolean {
    return x + width >= cameraX - 120 && x <= cameraX + 1080;
  }

  private wrap(value: number, modulus: number): number {
    return ((value % modulus) + modulus) % modulus;
  }

  private hash(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    return hash;
  }
}
