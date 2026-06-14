import { GAMEPLAY_CONFIG } from "../../config/gameplay";
import type { RunFlowState } from "../state/GameStateManager";

export type RespawnEvent = "none" | "respawn" | "gameOver";

export class RespawnSystem {
  state: RunFlowState = "spawn";
  private remaining = 0;
  private pendingGameOver = false;

  startPlay(): void {
    this.state = "play";
    this.remaining = 0;
    this.pendingGameOver = false;
  }

  beginDeath(gameOver: boolean): boolean {
    if (this.state !== "play") return false;
    this.state = "dying";
    this.remaining = GAMEPLAY_CONFIG.deathDuration;
    this.pendingGameOver = gameOver;
    return true;
  }

  update(deltaSeconds: number): RespawnEvent {
    if (this.state !== "dying" && this.state !== "respawn") return "none";
    this.remaining -= deltaSeconds;
    if (this.remaining > 0) return "none";
    if (this.state === "dying") {
      if (this.pendingGameOver) {
        this.state = "gameOver";
        return "gameOver";
      }
      this.state = "respawn";
      this.remaining = GAMEPLAY_CONFIG.respawnDuration;
      return "none";
    }
    this.state = "play";
    return "respawn";
  }
}
