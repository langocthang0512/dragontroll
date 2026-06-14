import type { SpriteAnimator } from "../animation/SpriteAnimator";
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
  ) {}

  render(gameplay: PrototypeGameplaySystem, state: Readonly<GameState>, animator: SpriteAnimator): void {
    const { context } = this.renderer;
    const { area, camera } = gameplay;
    this.drawBackground(camera.x);
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
      if (!pickup.collected && this.visible(pickup.x, pickup.w, camera.x)) this.drawGold(pickup.x, pickup.y);
    }
    for (const checkpoint of area.checkpoints) {
      if (!this.visible(checkpoint.x, checkpoint.w, camera.x)) continue;
      this.drawCheckpoint(checkpoint.x, checkpoint.y, gameplay.checkpoints.isActive(area.id, checkpoint.id), gameplay.checkpointPulse);
    }
    for (const hazard of area.hazards) {
      if (this.visible(hazard.x - 30, hazard.w + 60, camera.x)) this.drawHazard(hazard);
    }
    for (const enemy of area.enemies) {
      if (enemy.alive && this.visible(enemy.x, enemy.w, camera.x)) this.drawEnemy(enemy);
    }
    for (const projectile of gameplay.enemies.projectiles) {
      if (projectile.active && this.visible(projectile.x, projectile.w, camera.x)) this.drawProjectile(projectile.x, projectile.y);
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
    );
    this.drawForeground(camera.x);
    this.drawHud(state, gameplay.currentSection.label, gameplay.player.x / (area.width - gameplay.player.w));
  }

  private drawBackground(cameraX: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#17384a";
    context.fillRect(0, 0, 960, 540);
    context.fillStyle = "#25586a";
    context.fillRect(0, 88, 960, 452);
    context.fillStyle = "#4b8b82";
    context.fillRect(0, 176, 960, 364);
    context.fillStyle = "#83b99a";
    context.fillRect(0, 260, 960, 280);

    context.fillStyle = "#d5e3b1";
    for (let index = 0; index < 7; index++) {
      const x = this.wrap(index * 230 - cameraX * 0.08, 1230) - 130;
      const y = 72 + (index % 3) * 38;
      context.fillRect(x, y, 88, 8);
      context.fillRect(x + 18, y - 8, 56, 8);
    }

    context.fillStyle = "#326c66";
    for (let index = 0; index < 8; index++) {
      const x = this.wrap(index * 220 - cameraX * 0.14, 1320) - 180;
      const height = 128 + (index % 3) * 42;
      context.fillRect(x, 330 - height, 112, height);
      context.fillRect(x + 22, 310 - height, 68, 20);
      context.fillRect(x + 42, 282 - height, 28, 28);
    }

    context.fillStyle = "#204f51";
    for (let index = 0; index < 12; index++) {
      const x = this.wrap(index * 122 - cameraX * 0.25, 1220) - 120;
      const height = 116 + (index % 4) * 24;
      context.fillRect(x + 34, 408 - height, 18, height);
      context.fillRect(x, 408 - height, 88, 34);
      context.fillRect(x + 12, 388 - height, 60, 24);
    }
    context.fillStyle = "#143b43";
    context.fillRect(0, 408, 960, 132);
    context.fillStyle = "#24615d";
    for (let x = -40; x < 1000; x += 84) context.fillRect(x, 402 + (x % 3) * 3, 66, 14);
  }

  private drawForeground(cameraX: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#0d292f";
    for (let index = 0; index < 13; index++) {
      const x = this.wrap(index * 91 - cameraX * 0.48, 1180) - 100;
      const height = 18 + (index % 3) * 9;
      context.fillRect(x, 540 - height, 72, height);
      context.fillRect(x + 16, 528 - height, 38, 14);
    }
    context.fillStyle = "#18433f";
    context.fillRect(0, 532, 960, 8);
  }

  private drawPlatform(x: number, y: number, width: number, height: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#182d35";
    context.fillRect(x, y, width, height);
    context.fillStyle = "#36534b";
    context.fillRect(x + 3, y + 10, width - 6, Math.max(4, height - 10));
    context.fillStyle = "#43755c";
    context.fillRect(x, y, width, 10);
    context.fillStyle = "#8fbc72";
    context.fillRect(x, y, width, 4);
    context.fillStyle = "#c1d98a";
    for (let px = x + 10; px < x + width - 6; px += 34) context.fillRect(px, y - 3, 18, 3);
    context.fillStyle = "#203b3d";
    for (let px = x + 14; px < x + width - 12; px += 46) {
      context.fillRect(px, y + 18, 20, 5);
      if (height > 24) context.fillRect(px + 5, y + 28, 5, 9);
    }
  }

  private drawDecoration(decoration: EnvironmentDecoration): void {
    const { context } = this.renderer;
    const { x, y, scale } = decoration;
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    if (decoration.kind === "tree") {
      context.fillStyle = "#173a38";
      context.fillRect(-18, -148, 36, 148);
      context.fillRect(-42, -118, 28, 12);
      context.fillRect(14, -92, 38, 12);
      context.fillStyle = "#2f674d";
      context.fillRect(-64, -176, 128, 46);
      context.fillRect(-46, -198, 92, 28);
      context.fillStyle = "#649264";
      context.fillRect(-50, -188, 36, 12);
      context.fillRect(8, -170, 44, 10);
    } else if (decoration.kind === "ruin") {
      context.fillStyle = "#304e50";
      context.fillRect(-52, -112, 28, 112);
      context.fillRect(24, -92, 28, 92);
      context.fillRect(-62, -122, 48, 12);
      context.fillRect(14, -102, 48, 12);
      context.fillStyle = "#6c846d";
      context.fillRect(-46, -104, 8, 28);
      context.fillRect(32, -84, 7, 22);
      context.fillStyle = "#8fbc72";
      context.fillRect(-54, -126, 28, 4);
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
      context.fillStyle = "#6db9b3";
      context.fillRect(-22, -220, 44, 220);
      context.fillStyle = "#a5ddd1";
      context.fillRect(-14, -220, 9, 210);
      context.fillRect(8, -202, 6, 190);
      context.fillStyle = "#2b6c69";
      context.fillRect(-34, -8, 68, 8);
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

  private drawCheckpoint(x: number, y: number, active: boolean, pulse: number): void {
    const { context } = this.renderer;
    if (active && pulse > 0) {
      context.fillStyle = "rgba(185,226,133,.32)";
      context.fillRect(x - 12, y - 12, 66, 88);
    }
    context.fillStyle = "#172a31";
    context.fillRect(x - 5, y + 10, 52, 54);
    context.fillStyle = active ? "#587b5e" : "#3d5550";
    context.fillRect(x, y + 6, 42, 58);
    context.fillStyle = "#82926e";
    context.fillRect(x + 5, y, 32, 8);
    context.fillRect(x + 7, y + 12, 28, 42);
    context.fillStyle = "#1b3438";
    context.fillRect(x + 12, y + 16, 18, 38);
    context.fillStyle = active ? "#d9df7b" : "#738277";
    context.fillRect(x + 18, y + 22, 6, 18);
    context.fillRect(x + 15, y + 28, 12, 6);
    context.fillStyle = active ? "#f3d56b" : "#52625c";
    context.fillRect(x + 27, y + 42, 4, 4);
  }

  private drawGold(x: number, y: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#7a5129";
    context.fillRect(x + 4, y, 12, 20);
    context.fillStyle = "#e6a93f";
    context.fillRect(x, y + 5, 20, 10);
    context.fillStyle = "#ffe58a";
    context.fillRect(x + 5, y + 3, 7, 5);
    context.fillRect(x + 3, y + 7, 3, 5);
  }

  private drawEnemy(enemy: EnemyEntity): void {
    const { context } = this.renderer;
    context.save();
    context.translate(Math.round(enemy.x + enemy.w / 2), Math.round(enemy.y + enemy.h));
    context.scale(enemy.direction, 1);
    context.fillStyle = enemy.flashRemaining > 0 ? "#f4f2da" : "#183b3c";
    context.fillRect(-15, -28, 28, 22);
    context.fillRect(8, -34, 14, 16);
    context.fillRect(-21, -18, 10, 12);
    context.fillStyle = enemy.flashRemaining > 0 ? "#ffffff" : "#4f8c69";
    context.fillRect(-12, -32, 22, 22);
    context.fillRect(7, -38, 15, 15);
    context.fillRect(-22, -22, 12, 8);
    context.fillStyle = "#8fbc72";
    context.fillRect(-7, -36, 7, 5);
    context.fillRect(3, -39, 7, 5);
    context.fillStyle = "#e7d568";
    context.fillRect(15, -34, 4, 4);
    context.fillStyle = "#203038";
    context.fillRect(-10, -6, 6, 6);
    context.fillRect(7, -6, 6, 6);
    context.fillStyle = "#d7794b";
    context.fillRect(17, -26, 8, 5);
    context.restore();
  }

  private drawProjectile(x: number, y: number): void {
    const { context } = this.renderer;
    context.fillStyle = "rgba(219,247,239,.35)";
    context.fillRect(x - 4, y - 4, 18, 18);
    context.fillStyle = "#f7fff7";
    context.fillRect(x, y, 10, 10);
    context.fillStyle = "#c4f0df";
    context.fillRect(x + 2, y + 2, 4, 4);
  }

  private drawHazard(hazard: FallingHazard): void {
    const { context } = this.renderer;
    if (hazard.state === "telegraph") {
      context.fillStyle = "rgba(242,205,91,.3)";
      context.fillRect(hazard.x - 10, 120, hazard.w + 20, hazard.resetY - 120);
      context.fillStyle = "#f2cd5b";
      context.fillRect(hazard.x - 5, 472, hazard.w + 10, 5);
      context.fillRect(hazard.x + 8, 462, 12, 5);
    }
    context.fillStyle = "#322c45";
    context.fillRect(hazard.x + 4, hazard.y, 20, 36);
    context.fillRect(hazard.x, hazard.y + 10, 28, 18);
    context.fillStyle = "#805a7a";
    context.fillRect(hazard.x + 5, hazard.y + 4, 18, 26);
    context.fillStyle = "#d39b6b";
    context.fillRect(hazard.x + 8, hazard.y + 8, 6, 6);
    context.fillRect(hazard.x + 15, hazard.y + 19, 5, 7);
    context.fillStyle = "#efca83";
    context.fillRect(hazard.x + 10, hazard.y + 6, 4, 3);
  }

  private drawGoal(x: number, y: number): void {
    const { context } = this.renderer;
    context.fillStyle = "rgba(191,226,133,.22)";
    context.fillRect(x - 16, y - 18, 110, 108);
    context.fillStyle = "#172d34";
    context.fillRect(x, y + 22, 78, 64);
    context.fillStyle = "#536c5d";
    context.fillRect(x + 5, y + 12, 68, 74);
    context.fillStyle = "#8a9f72";
    context.fillRect(x + 12, y + 4, 54, 12);
    context.fillRect(x + 20, y, 38, 8);
    context.fillStyle = "#1a3739";
    context.fillRect(x + 22, y + 28, 34, 58);
    context.fillStyle = "#a9d477";
    context.fillRect(x + 34, y + 36, 10, 28);
    context.fillRect(x + 26, y + 45, 26, 10);
    context.fillStyle = "#f1d36c";
    context.fillRect(x + 37, y + 44, 4, 12);
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
}
