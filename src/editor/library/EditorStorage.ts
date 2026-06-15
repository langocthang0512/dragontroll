import type { EditorMapDocument, EditorRevision } from "../maps/EditorMap";
import { cloneEditorMap, validateEditorMap } from "../maps/EditorMap";

const DRAFT_KEY = "dragon_troll_editor_draft";
const HISTORY_KEY = "dragon_troll_editor_history";

interface StoredRevision extends EditorRevision { document: EditorMapDocument; }

export class EditorStorage {
  saveDraft(document: EditorMapDocument): void {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(this.stamp(document, "draft")));
  }

  loadDraft(): EditorMapDocument | undefined {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? validateEditorMap(JSON.parse(raw)) : undefined;
  }

  publish(document: EditorMapDocument, label = "Published map"): EditorMapDocument {
    const published = this.stamp(document, "published");
    const history = this.readHistory();
    history.unshift({ id: crypto.randomUUID(), label, status: "published", createdAt: published.updatedAt, document: cloneEditorMap(published) });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    this.saveDraft(published);
    return published;
  }

  revisions(): EditorRevision[] {
    return this.readHistory().map(({ document: _document, ...revision }) => revision);
  }

  restore(revisionId: string): EditorMapDocument | undefined {
    const revision = this.readHistory().find((item) => item.id === revisionId);
    return revision ? cloneEditorMap(revision.document) : undefined;
  }

  duplicate(document: EditorMapDocument): EditorMapDocument {
    return { ...cloneEditorMap(document), id: `${document.id}-copy`, name: `${document.name} COPY`, status: "draft", revision: 1, updatedAt: new Date().toISOString() };
  }

  export(document: EditorMapDocument): string {
    return JSON.stringify(this.stamp(document, document.status), null, 2);
  }

  import(raw: string): EditorMapDocument {
    return validateEditorMap(JSON.parse(raw));
  }

  private stamp(document: EditorMapDocument, status: EditorMapDocument["status"]): EditorMapDocument {
    return { ...cloneEditorMap(document), status, revision: document.revision + 1, updatedAt: new Date().toISOString() };
  }

  private readHistory(): StoredRevision[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) as StoredRevision[] : [];
    } catch {
      return [];
    }
  }
}
