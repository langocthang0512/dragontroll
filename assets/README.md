# Game assets

Runtime images and JSON data are registered in `src/game/assets/manifest.ts` so loading remains centralized and observable.

The production player atlas is generated deterministically by `tools/generate-player-atlas.mjs`. Temporary concept sources are excluded from the runtime manifest.
