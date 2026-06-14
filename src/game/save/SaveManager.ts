import type { CharacterVariant } from "../animation/types";

export interface SaveDocument {
  schemaVersion: 2;
  currentLevel: number;
  selectedCharacter: CharacterVariant;
  updatedAt: string;
}

const SAVE_KEY = "dragon_troll_island_save";
const LEGACY_SAVE_KEY = "dragon_troll_island_v10_save";

export class SaveManager {
  private document: SaveDocument;

  constructor(private readonly levelCount: number) {
    this.document = this.createDocument(0, "male");
  }

  load(): SaveDocument {
    const fallback = this.createDocument(this.readLegacyLevel(), "male");

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        this.write(fallback);
        return this.document;
      }

      const parsed = JSON.parse(raw) as Partial<SaveDocument>;
      this.document = this.createDocument(
        this.sanitizeLevel(parsed.currentLevel),
        this.sanitizeCharacter(parsed.selectedCharacter),
      );
      return this.document;
    } catch {
      this.document = fallback;
      return this.document;
    }
  }

  saveLevel(currentLevel: number): void {
    this.write(this.createDocument(currentLevel, this.document.selectedCharacter));
  }

  saveCharacter(selectedCharacter: CharacterVariant): void {
    this.write(this.createDocument(this.document.currentLevel, selectedCharacter));
  }

  resetProgress(): void {
    this.write(this.createDocument(0, this.document.selectedCharacter));
  }

  private readLegacyLevel(): number {
    try {
      return this.sanitizeLevel(Number(localStorage.getItem(LEGACY_SAVE_KEY) ?? 0));
    } catch {
      return 0;
    }
  }

  private createDocument(currentLevel: number, selectedCharacter: CharacterVariant): SaveDocument {
    return {
      schemaVersion: 2,
      currentLevel: this.sanitizeLevel(currentLevel),
      selectedCharacter: this.sanitizeCharacter(selectedCharacter),
      updatedAt: new Date().toISOString(),
    };
  }

  private sanitizeCharacter(value: unknown): CharacterVariant {
    return value === "female" ? "female" : "male";
  }

  private sanitizeLevel(value: unknown): number {
    const level = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0;
    return Math.max(0, Math.min(this.levelCount - 1, level));
  }

  private write(document: SaveDocument): void {
    this.document = document;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(document));
      localStorage.setItem(LEGACY_SAVE_KEY, String(document.currentLevel));
    } catch {
      // Saving is best-effort so blocked storage never stops the game loop.
    }
  }
}
