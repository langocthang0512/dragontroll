import type { AtlasAnimation, AtlasFrame, CharacterAnimationState } from "./types";

export class SpriteAnimator {
  private state: CharacterAnimationState = "idle";
  private elapsed = 0;

  get currentState(): CharacterAnimationState {
    return this.state;
  }

  setState(state: CharacterAnimationState, restart = false): void {
    if (state === this.state && !restart) return;
    this.state = state;
    this.elapsed = 0;
  }

  update(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
  }

  frame(animation: AtlasAnimation): AtlasFrame {
    const rawIndex = Math.floor(this.elapsed * animation.fps);
    const index = animation.loop
      ? rawIndex % animation.frames.length
      : Math.min(rawIndex, animation.frames.length - 1);
    return animation.frames[index];
  }
}
