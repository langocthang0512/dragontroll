import type { Player } from "../entities/Player";
import type { LevelMap } from "../maps/types";
import type { PerformanceSnapshot } from "../performance/PerformanceMonitor";
import type { UIFramework } from "../ui/UIFramework";

export class DebugTools {
  enabled = false;

  toggle(): void {
    this.enabled = !this.enabled;
  }

  render(
    context: CanvasRenderingContext2D,
    ui: UIFramework,
    level: LevelMap | undefined,
    player: Player,
    cameraX: number,
    performance: PerformanceSnapshot,
  ): void {
    if (!this.enabled) return;

    if (level) {
      context.save();
      context.translate(-cameraX, 0);
      context.strokeStyle = "#00ffff";
      context.lineWidth = 1;
      for (const item of [
        ...level.platforms,
        ...level.crumbly,
        ...level.moving,
        ...level.spikes,
        ...level.lava,
        ...level.enemies,
        ...level.checkpoints,
      ]) {
        context.strokeRect(item.x, item.y, item.w, item.h);
      }
      context.strokeStyle = "#ff00ff";
      context.strokeRect(player.x, player.y, player.w, player.h);
      context.restore();
    }

    ui.panel(12, 118, 245, 82, "rgba(5,10,20,.82)");
    ui.text(`FPS ${performance.fps.toFixed(1)}`, 24, 142, { font: "16px monospace" });
    ui.text(`Frame ${performance.frameTimeMs.toFixed(2)} ms`, 24, 166, { font: "16px monospace" });
    ui.text(`Updates ${performance.updateCount}`, 24, 190, { font: "16px monospace" });
  }
}
