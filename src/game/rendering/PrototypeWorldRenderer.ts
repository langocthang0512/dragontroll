import type { SpriteAnimator } from "../animation/SpriteAnimator";
import type { PrototypeGameplaySystem } from "../systems/PrototypeGameplaySystem";
import type { GameState } from "../state/GameStateManager";
import type { CanvasRenderer } from "./CanvasRenderer";
import type { CharacterRenderer } from "./CharacterRenderer";

export const PAUSE_BUTTON = { x: 890, y: 14, w: 54, h: 42 } as const;

export class PrototypeWorldRenderer {
  constructor(
    private readonly renderer: CanvasRenderer,
    private readonly characters: CharacterRenderer,
  ) {}

  render(gameplay: PrototypeGameplaySystem, state: Readonly<GameState>, animator: SpriteAnimator): void {
    const { context } = this.renderer;
    const { area, camera } = gameplay;
    this.drawSky(camera.x);
    context.save();
    context.translate(-camera.x, 0);

    for (const platform of area.platforms) this.drawPlatform(platform.x, platform.y, platform.w, platform.h);
    for (const pickup of area.gold) if (!pickup.collected) this.drawGold(pickup.x, pickup.y);
    for (const checkpoint of area.checkpoints) {
      this.drawCheckpoint(
        checkpoint.x,
        checkpoint.y,
        gameplay.checkpoints.isActive(area.id, checkpoint.id),
        gameplay.checkpointPulse,
      );
    }
    this.drawTrainingTarget(area.target.x, area.target.y, area.target.hitCount, area.target.flashRemaining > 0);

    if (gameplay.landingPulse > 0) {
      context.fillStyle = "rgba(233,241,243,.7)";
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
    this.drawHud(state, area.name, area.target.hitCount);
  }

  private drawSky(cameraX: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#79c8e8";
    context.fillRect(0, 0, 960, 540);
    context.fillStyle = "#a9e2ef";
    for (let index = 0; index < 8; index++) {
      const x = ((index * 270 - cameraX * 0.18) % 1200) - 120;
      const y = 92 + (index % 3) * 62;
      context.fillRect(x, y, 94, 16);
      context.fillRect(x + 26, y - 12, 70, 12);
    }
    context.fillStyle = "#537f91";
    for (let x = -100; x < 1100; x += 150) {
      const shifted = x - (cameraX * 0.08 % 150);
      context.fillRect(shifted, 360, 110, 140);
      context.fillRect(shifted + 22, 334, 66, 26);
    }
  }

  private drawPlatform(x: number, y: number, width: number, height: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#263950";
    context.fillRect(x, y, width, height);
    context.fillStyle = "#4d8f78";
    context.fillRect(x, y, width, 8);
    context.fillStyle = "#82c59d";
    context.fillRect(x, y, width, 3);
    context.fillStyle = "#182238";
    for (let px = x + 12; px < x + width - 8; px += 32) context.fillRect(px, y + 16, 18, 5);
  }

  private drawCheckpoint(x: number, y: number, active: boolean, pulse: number): void {
    const { context } = this.renderer;
    const glow = active && pulse > 0 ? 4 : 0;
    if (glow) {
      context.fillStyle = "rgba(130,197,157,.35)";
      context.fillRect(x - 8, y - 8, 58, 80);
    }
    context.fillStyle = "#101827";
    context.fillRect(x, y + 8, 42, 56);
    context.fillStyle = active ? "#4d8f78" : "#526579";
    context.fillRect(x + 4, y + 4, 34, 60);
    context.fillStyle = active ? "#82c59d" : "#8fa8b8";
    context.fillRect(x + 9, y, 24, 6);
    context.fillRect(x + 10, y + 12, 22, 38);
    context.fillStyle = "#182238";
    context.fillRect(x + 14, y + 16, 14, 34);
    context.fillStyle = active ? "#f0c35a" : "#718096";
    context.fillRect(x + 25, y + 32, 3, 3);
  }

  private drawGold(x: number, y: number): void {
    const { context } = this.renderer;
    context.fillStyle = "#8a6c3d";
    context.fillRect(x + 4, y, 12, 20);
    context.fillStyle = "#f0c35a";
    context.fillRect(x, y + 5, 20, 10);
    context.fillStyle = "#ffe59a";
    context.fillRect(x + 5, y + 3, 6, 4);
  }

  private drawTrainingTarget(x: number, y: number, hitCount: number, flashing: boolean): void {
    const { context } = this.renderer;
    context.fillStyle = "#4a2c1a";
    context.fillRect(x + 11, y + 22, 6, 40);
    context.fillRect(x + 3, y + 58, 22, 4);
    context.fillStyle = flashing ? "#e9f1f3" : "#8a5630";
    context.fillRect(x + 2, y + 8, 24, 28);
    context.fillStyle = "#171827";
    context.fillRect(x + 7, y + 15, 4, 4);
    context.fillRect(x + 17, y + 15, 4, 4);
    context.fillRect(x + 9, y + 27, 10, 3);
    context.fillStyle = "#f0c35a";
    for (let index = 0; index < Math.min(hitCount, 5); index++) context.fillRect(x + index * 5 + 2, y, 3, 4);
  }

  private drawHud(state: Readonly<GameState>, areaName: string, hitCount: number): void {
    const { ui, context } = this.renderer;
    ui.pixelPanel(12, 12, 420, 76, "rgba(17,28,44,.92)", "#718096");
    ui.pixelText(areaName, 24, 26, 2, "#f0c35a");
    ui.pixelText(`LIVES ${state.lives}   GOLD ${state.gold}   HITS ${hitCount}`, 24, 56, 2, "#d9e2e8");
    ui.pixelPanel(446, 12, 428, 76, "rgba(17,28,44,.92)", "#718096");
    ui.pixelText("MOVE A/D   JUMP SPACE", 460, 26, 2);
    ui.pixelText("ATTACK J/X   TEST K", 460, 56, 2, "#b8c6d1");
    ui.pixelPanel(PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.w, PAUSE_BUTTON.h, "#202d45", "#f0c35a");
    context.fillStyle = "#f5f1dc";
    context.fillRect(PAUSE_BUTTON.x + 18, PAUSE_BUTTON.y + 13, 5, 16);
    context.fillRect(PAUSE_BUTTON.x + 31, PAUSE_BUTTON.y + 13, 5, 16);
    if (state.message) ui.pixelText(state.message, 480, 106, 2, "#f5f1dc", "center");
  }
}
