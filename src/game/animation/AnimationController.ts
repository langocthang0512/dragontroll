interface Animation {
  elapsed: number;
  duration: number;
  update: (progress: number) => void;
  complete?: () => void;
}

export class AnimationController {
  private readonly animations = new Map<string, Animation>();

  play(id: string, duration: number, update: Animation["update"], complete?: Animation["complete"]): void {
    this.animations.set(id, { elapsed: 0, duration: Math.max(duration, Number.EPSILON), update, complete });
  }

  stop(id: string): void {
    this.animations.delete(id);
  }

  update(deltaSeconds: number): void {
    for (const [id, animation] of this.animations) {
      animation.elapsed += deltaSeconds;
      const progress = Math.min(1, animation.elapsed / animation.duration);
      animation.update(progress);
      if (progress === 1) {
        this.animations.delete(id);
        animation.complete?.();
      }
    }
  }

  clear(): void {
    this.animations.clear();
  }
}
