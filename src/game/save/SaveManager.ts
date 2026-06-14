import type { CharacterVariant } from "../animation/types";

export const DEFAULT_LIVES = 3;

export interface CheckpointSave {
  areaId: string;
  checkpointId: string;
}

export interface RunSave {
  lives: number;
  gold: number;
  collectedGoldIds: string[];
  checkpoint?: CheckpointSave;
}

export interface SaveDocument {
  schemaVersion: 3;
  currentLevel: number;
  selectedCharacter: CharacterVariant;
  run: RunSave;
  unlocks: string[];
  updatedAt: string;
}

const SAVE_KEY = "dragon_troll_island_save";
const LEGACY_SAVE_KEY = "dragon_troll_island_v10_save";

export class SaveManager {
  private document: SaveDocument;

  constructor(private readonly levelCount: number) {
    this.document = this.createDocument(0, "male", this.defaultRun(), []);
  }

  load(): SaveDocument {
    const fallback = this.createDocument(this.readLegacyLevel(), "male", this.defaultRun(), []);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        this.write(fallback);
        return this.snapshot;
      }
      const parsed = JSON.parse(raw) as Partial<SaveDocument> & {
        lives?: unknown;
        gold?: unknown;
        checkpoint?: unknown;
      };
      const legacyRun: Partial<RunSave> = {
        lives: parsed.lives as number | undefined,
        gold: parsed.gold as number | undefined,
        checkpoint: parsed.checkpoint as CheckpointSave | undefined,
      };
      this.document = this.createDocument(
        this.sanitizeLevel(parsed.currentLevel),
        this.sanitizeCharacter(parsed.selectedCharacter),
        this.sanitizeRun(parsed.run ?? legacyRun),
        this.sanitizeUnlocks(parsed.unlocks),
      );
      this.write(this.document);
      return this.snapshot;
    } catch {
      this.document = fallback;
      return this.snapshot;
    }
  }

  get snapshot(): SaveDocument {
    return structuredClone(this.document);
  }

  saveLevel(currentLevel: number): void {
    this.write(this.createDocument(currentLevel, this.document.selectedCharacter, this.document.run, this.document.unlocks));
  }

  saveCharacter(selectedCharacter: CharacterVariant): void {
    this.write(this.createDocument(this.document.currentLevel, selectedCharacter, this.document.run, this.document.unlocks));
  }

  saveRun(run: RunSave): void {
    this.write(this.createDocument(this.document.currentLevel, this.document.selectedCharacter, run, this.document.unlocks));
  }

  addUnlock(unlockId: string): void {
    const unlocks = Array.from(new Set([...this.document.unlocks, unlockId]));
    this.write(this.createDocument(this.document.currentLevel, this.document.selectedCharacter, this.document.run, unlocks));
  }

  resetRun(): void {
    this.saveRun(this.defaultRun());
  }

  resetProgress(): void {
    this.write(this.createDocument(0, this.document.selectedCharacter, this.defaultRun(), this.document.unlocks));
  }

  private defaultRun(): RunSave {
    return { lives: DEFAULT_LIVES, gold: 0, collectedGoldIds: [] };
  }

  private readLegacyLevel(): number {
    try {
      return this.sanitizeLevel(Number(localStorage.getItem(LEGACY_SAVE_KEY) ?? 0));
    } catch {
      return 0;
    }
  }

  private createDocument(currentLevel: number, selectedCharacter: CharacterVariant, run: RunSave, unlocks: string[]): SaveDocument {
    return {
      schemaVersion: 3,
      currentLevel: this.sanitizeLevel(currentLevel),
      selectedCharacter: this.sanitizeCharacter(selectedCharacter),
      run: this.sanitizeRun(run),
      unlocks: this.sanitizeUnlocks(unlocks),
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

  private sanitizeRun(value: unknown): RunSave {
    const run = value && typeof value === "object" ? value as Partial<RunSave> : {};
    const lives = typeof run.lives === "number" && Number.isFinite(run.lives)
      ? Math.max(0, Math.min(DEFAULT_LIVES, Math.trunc(run.lives)))
      : DEFAULT_LIVES;
    const gold = typeof run.gold === "number" && Number.isFinite(run.gold)
      ? Math.max(0, Math.trunc(run.gold))
      : 0;
    const collectedGoldIds = Array.isArray(run.collectedGoldIds)
      ? Array.from(new Set(run.collectedGoldIds.filter((item): item is string => typeof item === "string"))).slice(0, 1024)
      : [];
    const checkpoint = this.sanitizeCheckpoint(run.checkpoint);
    return checkpoint ? { lives, gold, collectedGoldIds, checkpoint } : { lives, gold, collectedGoldIds };
  }

  private sanitizeCheckpoint(value: unknown): CheckpointSave | undefined {
    if (!value || typeof value !== "object") return undefined;
    const checkpoint = value as Partial<CheckpointSave>;
    if (typeof checkpoint.areaId !== "string" || typeof checkpoint.checkpointId !== "string") return undefined;
    return { areaId: checkpoint.areaId, checkpointId: checkpoint.checkpointId };
  }

  private sanitizeUnlocks(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(new Set(value.filter((item): item is string => typeof item === "string"))).slice(0, 256);
  }

  private write(document: SaveDocument): void {
    this.document = document;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(document));
      localStorage.setItem(LEGACY_SAVE_KEY, String(document.currentLevel));
    } catch {
      // Storage is best-effort; the in-memory run remains playable.
    }
  }
}
