interface SaveDocument {
  schemaVersion: 1;
  currentLevel: number;
  updatedAt: string;
}

const SAVE_KEY = "dragon_troll_island_save";
const LEGACY_SAVE_KEY = "dragon_troll_island_v10_save";

export class SaveManager {
  constructor(private readonly levelCount: number) {}

  load(): SaveDocument {
    const fallback = this.createDocument(this.readLegacyLevel());

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        this.write(fallback);
        return fallback;
      }

      const parsed = JSON.parse(raw) as Partial<SaveDocument>;
      return this.createDocument(this.sanitizeLevel(parsed.currentLevel));
    } catch {
      return fallback;
    }
  }

  saveLevel(currentLevel: number): void {
    this.write(this.createDocument(currentLevel));
  }

  clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY);
    } catch {
      // Storage can be unavailable in privacy modes; gameplay remains functional.
    }
  }

  private readLegacyLevel(): number {
    try {
      return this.sanitizeLevel(Number(localStorage.getItem(LEGACY_SAVE_KEY) ?? 0));
    } catch {
      return 0;
    }
  }

  private createDocument(currentLevel: number): SaveDocument {
    return {
      schemaVersion: 1,
      currentLevel: this.sanitizeLevel(currentLevel),
      updatedAt: new Date().toISOString(),
    };
  }

  private sanitizeLevel(value: unknown): number {
    const level = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0;
    return Math.max(0, Math.min(this.levelCount - 1, level));
  }

  private write(document: SaveDocument): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(document));
      localStorage.setItem(LEGACY_SAVE_KEY, String(document.currentLevel));
    } catch {
      // Saving is best-effort so blocked storage never stops the game loop.
    }
  }
}
