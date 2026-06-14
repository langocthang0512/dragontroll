import { GAMEPLAY_CONFIG } from "../../config/gameplay";
import type { Player } from "../entities/Player";
import type { FallingHazard } from "../gameplay/types";
import { intersects } from "../physics/collision";

export class FallingHazardSystem {
  reset(hazards: readonly FallingHazard[]): void {
    for (const hazard of hazards) this.resetHazard(hazard);
  }

  update(hazards: readonly FallingHazard[], player: Player, deltaSeconds: number): string | undefined {
    const playerCenter = player.x + player.w / 2;
    for (const hazard of hazards) {
      if (hazard.state === "idle" && playerCenter >= hazard.triggerX && playerCenter <= hazard.triggerX + hazard.triggerWidth) {
        hazard.state = "telegraph";
        hazard.telegraphRemaining = GAMEPLAY_CONFIG.trapTelegraphDuration;
      } else if (hazard.state === "telegraph") {
        hazard.telegraphRemaining -= deltaSeconds;
        if (hazard.telegraphRemaining <= 0) hazard.state = "falling";
      } else if (hazard.state === "falling") {
        hazard.vy += GAMEPLAY_CONFIG.trapGravity * deltaSeconds;
        hazard.y += hazard.vy * deltaSeconds;
        if (intersects(player, hazard)) {
          this.resetHazard(hazard);
          return "FALLING EGG HIT  LIFE LOST";
        }
        if (hazard.y >= hazard.resetY) this.resetHazard(hazard);
      }
    }
    return undefined;
  }

  private resetHazard(hazard: FallingHazard): void {
    hazard.y = hazard.spawnY;
    hazard.vy = 0;
    hazard.state = "idle";
    hazard.telegraphRemaining = 0;
  }
}
