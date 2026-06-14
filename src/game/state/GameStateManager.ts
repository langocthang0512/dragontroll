import type { CharacterVariant } from "../animation/types";

export type GameMode = "loading" | "menu" | "settings" | "character" | "playing" | "paused";

export interface GameState {
  mode: GameMode;
  currentLevel: number;
  deaths: number;
  message: string;
  levelCleared: boolean;
  selectedCharacter: CharacterVariant;
}

type StateListener = (state: Readonly<GameState>) => void;

export class GameStateManager {
  private readonly listeners = new Set<StateListener>();

  constructor(private state: GameState) {}

  get snapshot(): Readonly<GameState> {
    return this.state;
  }

  patch(next: Partial<GameState>): void {
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener(this.state);
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
