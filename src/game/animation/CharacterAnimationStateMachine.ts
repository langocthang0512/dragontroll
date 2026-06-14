import type { Player } from "../entities/Player";
import { SpriteAnimator } from "./SpriteAnimator";
import type { CharacterAnimationState } from "./types";

export class CharacterAnimationStateMachine {
  readonly animator = new SpriteAnimator();
  private override?: CharacterAnimationState;
  private overrideRemaining = 0;

  playOnce(state: CharacterAnimationState, duration: number): void {
    this.override = state;
    this.overrideRemaining = duration;
    this.animator.setState(state, true);
  }

  update(deltaSeconds: number, player: Player): void {
    if (this.override) {
      this.overrideRemaining -= deltaSeconds;
      if (this.overrideRemaining <= 0) this.override = undefined;
    }
    if (!this.override) this.animator.setState(this.resolveMovementState(player));
    this.animator.update(deltaSeconds);
  }

  private resolveMovementState(player: Player): CharacterAnimationState {
    if (!player.ground) return player.vy < 0 ? "jump" : "fall";
    return Math.abs(player.vx) > 0.1 ? "run" : "idle";
  }
}
