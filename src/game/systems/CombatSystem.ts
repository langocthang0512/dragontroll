import { GAMEPLAY_CONFIG } from "../../config/gameplay";
import type { Player } from "../entities/Player";
import type { TrainingTarget } from "../gameplay/types";
import type { Rect } from "../physics/collision";
import { intersects } from "../physics/collision";

export type CombatState = "ready" | "attacking" | "cooldown";

export interface CombatUpdate {
  started: boolean;
  hit: boolean;
  finished: boolean;
  hitTargetId?: string;
}

export class CombatSystem {
  state: CombatState = "ready";
  private elapsed = 0;
  private hitApplied = false;

  requestAttack(): boolean {
    if (this.state !== "ready") return false;
    this.state = "attacking";
    this.elapsed = 0;
    this.hitApplied = false;
    return true;
  }

  interrupt(): void {
    this.state = "ready";
    this.elapsed = 0;
    this.hitApplied = false;
  }

  update(deltaSeconds: number, player: Player, target: TrainingTarget | readonly TrainingTarget[]): CombatUpdate {
    const result: CombatUpdate = { started: false, hit: false, finished: false };
    const targets = Array.isArray(target) ? target : [target];
    for (const item of targets) {
      if (item.flashRemaining > 0) item.flashRemaining = Math.max(0, item.flashRemaining - deltaSeconds);
    }
    if (this.state === "ready") return result;

    this.elapsed += deltaSeconds;
    if (this.state === "attacking") {
      const active = this.elapsed >= GAMEPLAY_CONFIG.attackActiveStart && this.elapsed <= GAMEPLAY_CONFIG.attackActiveEnd;
      const hitTarget = active && !this.hitApplied
        ? targets.find((item) => (item as TrainingTarget & { alive?: boolean }).alive !== false && intersects(this.hitbox(player), item))
        : undefined;
      if (hitTarget) {
        this.hitApplied = true;
        hitTarget.hitCount++;
        hitTarget.flashRemaining = 0.12;
        result.hit = true;
        result.hitTargetId = hitTarget.id;
      }
      if (this.elapsed >= GAMEPLAY_CONFIG.attackDuration) {
        this.state = "cooldown";
        this.elapsed = 0;
        result.finished = true;
      }
      return result;
    }

    if (this.elapsed >= GAMEPLAY_CONFIG.attackCooldown) {
      this.state = "ready";
      this.elapsed = 0;
    }
    return result;
  }

  hitbox(player: Player): Rect {
    return {
      x: player.face === 1 ? player.x + player.w - 2 : player.x - 38,
      y: player.y + 8,
      w: 40,
      h: 30,
    };
  }
}
