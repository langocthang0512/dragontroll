# Developer Content Toolkit

Open the toolkit from **Developer Tools** on the main menu or press `Ctrl+Shift+E` anywhere in the game. It is a browser-native DOM workspace layered over the existing Canvas game and does not replace gameplay or rendering architecture.

## Workspace

- Asset Browser: search, category filters, sorting, favorites, virtualized thumbnails, drag/drop, and animated metadata preview.
- Scene View: selection, shift multi-select, move, duplicate, delete, copy/paste, snap, grid size, zoom, pan, layers, and supported rotation properties.
- Properties: transform, animation, collision, behavior, difficulty, and JSON metadata.
- Preview and QA: asset usage, animation state, collision, hitbox, checkpoint, spawn, FPS, and available heap metrics.
- Storage: local draft save, autosave, load, map duplication, editor JSON and engine-native import/export, publish, revision history, and restore.

`PLAY` converts the current editor document into the engine's native `PrototypeArea` format. Play-test lives, gold, checkpoints, deaths, and unlocks are sandboxed and never written to the production save. Use the return button or `Ctrl+Shift+E` to resume editing.

## Content Structure

- `src/editor/assets`: production asset catalog and metadata
- `src/editor/maps`: versioned editor map schema and engine conversion
- `src/editor/library`: draft, revision, and undo/redo services
- `src/editor/presets`: shared authoring presets
- `src/editor/templates`: reusable map templates

Exported maps use human-readable JSON with schema version `1`. Imported documents are validated before entering the editor.
