import type { Player } from "../entities/Player";
import type { LevelMap } from "../maps/types";
import type { GameState } from "../state/GameStateManager";
import type { CanvasRenderer } from "./CanvasRenderer";

export class LegacyWorldRenderer {
  constructor(private readonly renderer: CanvasRenderer) {}

  renderMenu(level: LevelMap, player: Player, state: Readonly<GameState>): void {
    this.drawSky(level, 0);
    const { ui } = this.renderer;
    ui.panel(210, 105, 540, 330, "rgba(0,0,0,.62)");
    ui.text("Dragon Troll Island", 285, 170, { font: "42px Arial" });
    ui.text("v1.0 - 5 longer troll levels", 355, 210, { font: "20px Arial" });
    ui.text("ENTER: Continue saved level", 345, 275, { font: "20px Arial" });
    ui.text("N: New Game", 410, 315, { font: "20px Arial" });
    ui.text(`Saved level: ${state.currentLevel + 1}/5`, 405, 355, { font: "20px Arial" });
    ui.text("Traps reset after death/checkpoint respawn.", 285, 395, { font: "20px Arial" });
    this.drawDragon(455, 225, player.face, 0);
  }

  renderWorld(level: LevelMap, player: Player, state: Readonly<GameState>, cameraX: number): void {
    const context = this.renderer.context;
    this.drawSky(level, cameraX);
    context.save();
    context.translate(-cameraX, 0);

    for (const platform of level.platforms) {
      context.fillStyle = level.ice ? "#90e0ef" : "#43aa52";
      context.fillRect(platform.x, platform.y, platform.w, platform.h);
      context.fillStyle = level.ice ? "#48cae4" : "#2f7d32";
      context.fillRect(platform.x, platform.y + platform.h - 7, platform.w, 7);
    }
    for (const platform of level.crumbly) {
      if (platform.gone) continue;
      context.fillStyle = platform.fall ? "#9a7b4f" : "#b08968";
      context.fillRect(platform.x, platform.y, platform.w, platform.h);
      context.fillStyle = "#6f4e37";
      for (let x = platform.x + 8; x < platform.x + platform.w - 8; x += 22) context.fillRect(x, platform.y + 7, 12, 4);
    }
    for (const platform of level.moving) {
      context.fillStyle = "#ffd166";
      context.fillRect(platform.x, platform.y, platform.w, platform.h);
      context.fillStyle = "#9d6b00";
      context.fillRect(platform.x, platform.y + platform.h - 5, platform.w, 5);
    }
    for (const lava of level.lava) {
      context.fillStyle = "#ff3b1f";
      context.fillRect(lava.x, lava.y, lava.w, lava.h);
      context.fillStyle = "#ffd166";
      for (let x = lava.x; x < lava.x + lava.w; x += 24) context.fillRect(x, lava.y + 6, 12, 6);
    }
    for (const spike of level.spikes) {
      context.fillStyle = level.ice ? "#caf0f8" : "#df2935";
      context.beginPath();
      context.moveTo(spike.x, spike.y + spike.h);
      context.lineTo(spike.x + spike.w / 2, spike.y);
      context.lineTo(spike.x + spike.w, spike.y + spike.h);
      context.fill();
    }
    for (const block of level.fallingBlocks) {
      context.fillStyle = level.ice ? "#caf0f8" : "#8b5e34";
      context.fillRect(block.x, block.y, block.w, block.h);
      context.fillStyle = level.ice ? "#90e0ef" : "#5c3d22";
      context.fillRect(block.x + 8, block.y + 8, block.w - 16, block.h - 16);
    }
    for (const enemy of level.enemies) {
      if (enemy.boss) {
        this.drawBossEnemy(enemy.x, enemy.y, enemy.w, enemy.h);
        continue;
      }
      context.fillStyle = "#c1121f";
      context.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
      context.fillStyle = "#fff";
      context.fillRect(enemy.x + 7, enemy.y + 8, 5, 5);
      context.fillRect(enemy.x + 22, enemy.y + 8, 5, 5);
      context.fillStyle = "#111";
      context.fillRect(enemy.x + 9, enemy.y + 10, 2, 2);
      context.fillRect(enemy.x + 24, enemy.y + 10, 2, 2);
    }
    for (const gem of level.gems) {
      if (gem.active === false) continue;
      context.fillStyle = "#ffd700";
      context.fillRect(gem.x + 8, gem.y, 8, 5);
      context.fillRect(gem.x + 4, gem.y + 5, 16, 10);
      context.fillRect(gem.x + 8, gem.y + 15, 8, 8);
    }
    for (const checkpoint of level.checkpoints) {
      context.fillStyle = checkpoint.real ? "#3a86ff" : "#8d99ae";
      context.fillRect(checkpoint.x, checkpoint.y, checkpoint.w, checkpoint.h);
      context.fillStyle = "#fff";
      context.fillRect(checkpoint.x + 10, checkpoint.y + 8, 18, 12);
    }
    context.fillStyle = "#ffe066";
    context.beginPath();
    context.ellipse(level.egg.x + 22, level.egg.y + 45, 22, 45, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ff9f1c";
    context.fillRect(level.egg.x + 15, level.egg.y + 25, 8, 8);
    context.fillRect(level.egg.x + 28, level.egg.y + 45, 8, 8);
    context.restore();

    this.drawDragon(player.x, player.y, player.face, cameraX);
    this.drawHud(level, state);
    if (state.levelCleared) this.drawLevelComplete(state);
  }

  private drawSky(level: LevelMap, cameraX: number): void {
    const { context, canvas } = this.renderer;
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, level.bg[0]);
    gradient.addColorStop(1, level.bg[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(255,255,255,0.28)";
    for (let index = 0; index < 10; index++) {
      const x = ((index * 330 - cameraX * 0.2) % (canvas.width + 350)) - 140;
      const y = 45 + (index % 4) * 55;
      context.fillRect(x, y, 85, 18);
      context.fillRect(x + 30, y - 12, 95, 22);
      context.fillRect(x + 85, y + 5, 60, 14);
    }
  }

  private drawDragon(x: number, y: number, face: -1 | 1, cameraX: number): void {
    const { context } = this.renderer;
    context.save();
    context.translate(Math.floor(x - cameraX), Math.floor(y));
    if (face === -1) {
      context.translate(42, 0);
      context.scale(-1, 1);
    }
    context.fillStyle = "#7b45ff";
    context.fillRect(4, 12, 30, 18); context.fillRect(10, 6, 18, 10); context.fillRect(28, 7, 18, 19);
    context.fillStyle = "#5f2fd1";
    context.fillRect(6, 29, 8, 7); context.fillRect(25, 29, 8, 7); context.fillRect(2, 18, 8, 8);
    context.fillStyle = "#b78cff";
    context.fillRect(10, 16, 18, 6); context.fillRect(32, 12, 9, 6);
    context.fillStyle = "#ffcf4d";
    context.fillRect(31, 1, 4, 7); context.fillRect(39, 1, 4, 7);
    context.fillStyle = "#ff5d5d";
    context.fillRect(11, -5, 5, 11); context.fillRect(18, -8, 5, 14); context.fillRect(25, -5, 5, 11);
    context.fillStyle = "#ffd166";
    context.fillRect(43, 13, 10, 4); context.fillRect(46, 10, 5, 10);
    context.fillStyle = "#fff";
    context.fillRect(38, 10, 5, 5);
    context.fillStyle = "#111";
    context.fillRect(40, 12, 2, 2);
    context.fillStyle = "#5f2fd1";
    context.fillRect(-4, 17, 9, 5); context.fillRect(-8, 19, 6, 4);
    context.restore();
  }

  private drawBossEnemy(x: number, y: number, width: number, height: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#2b164f";
    context.fillRect(x, y, width, height);
    context.fillStyle = "#ff5555";
    context.fillRect(x + 10, y - 15, 10, 15); context.fillRect(x + 45, y - 15, 10, 15);
    context.fillStyle = "#fff";
    context.fillRect(x + 45, y + 18, 8, 8);
    context.fillStyle = "#111";
    context.fillRect(x + 49, y + 21, 3, 3);
  }

  private drawHud(level: LevelMap, state: Readonly<GameState>): void {
    const { ui } = this.renderer;
    ui.panel(12, 12, 570, 96);
    ui.text(level.name, 24, 40, { font: "22px Arial" });
    ui.text(state.message, 24, 68);
    ui.text(`Deaths: ${state.deaths} | Level ${state.currentLevel + 1}/5 | Checkpoint saves on blue flag`, 24, 94);
    ui.panel(620, 12, 320, 58);
    ui.text("A/D or Arrow = Move", 635, 36);
    ui.text("Space/W/Up = Jump | ESC = Menu", 635, 60);
  }

  private drawLevelComplete(state: Readonly<GameState>): void {
    const { ui } = this.renderer;
    ui.panel(250, 205, 470, 125, "rgba(0,0,0,.62)");
    ui.text(state.message, 300, 255, { font: "28px Arial" });
    ui.text(state.currentLevel < 4 ? "Press ENTER for next level" : "Press R to restart", 365, 292, { font: "20px Arial" });
  }
}
