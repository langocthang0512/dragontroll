import type { EditorMapDocument } from "../maps/EditorMap";
import { cloneEditorMap } from "../maps/EditorMap";

export class EditorHistory {
  private undoStack: EditorMapDocument[] = [];
  private redoStack: EditorMapDocument[] = [];

  constructor(private limit = 50) {}

  capture(document: EditorMapDocument): void {
    this.undoStack.push(cloneEditorMap(document));
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(current: EditorMapDocument): EditorMapDocument | undefined {
    const previous = this.undoStack.pop();
    if (!previous) return undefined;
    this.redoStack.push(cloneEditorMap(current));
    return previous;
  }

  redo(current: EditorMapDocument): EditorMapDocument | undefined {
    const next = this.redoStack.pop();
    if (!next) return undefined;
    this.undoStack.push(cloneEditorMap(current));
    return next;
  }

  get canUndo(): boolean { return this.undoStack.length > 0; }
  get canRedo(): boolean { return this.redoStack.length > 0; }
}
