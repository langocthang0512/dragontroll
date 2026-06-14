import { DEFAULT_LIVES } from "../save/SaveManager";

export interface DamageResult {
  remainingLives: number;
  gameOver: boolean;
}

export class LivesSystem {
  private value = DEFAULT_LIVES;

  get lives(): number {
    return this.value;
  }

  restore(lives: number): void {
    this.value = Math.max(0, Math.min(DEFAULT_LIVES, Math.trunc(lives)));
  }

  reset(): void {
    this.value = DEFAULT_LIVES;
  }

  damage(): DamageResult {
    this.value = Math.max(0, this.value - 1);
    return { remainingLives: this.value, gameOver: this.value === 0 };
  }
}
