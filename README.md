# Dragon Troll Island

Dragon Troll Island is a browser platform game running on a modular TypeScript and Canvas 2D foundation. The Visual Recovery Build includes the complete Lost World Map 1 with high-fidelity modern pixel art, detailed player animation, contact-based dragon variants, falling egg and spike hazards, checkpoint respawning, persistent gold, a basic life shop, Game Over, and victory flow.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer

## Setup

```bash
npm install
npm run dev
```

Vite prints the local development URL. Controls are `A`/`D` or arrow keys to move, `Space`/`W`/up arrow to jump, `J`/`X` to attack, and `Escape` to pause. Menus use arrows or `W`/`S`, `Enter`, and `Escape`. Press the backquote key to toggle diagnostics. Open the content toolkit from the main menu or with `Ctrl+Shift+E`.

## Quality checks

```bash
npm run assets:build
npm test
npm run check
npm run build
```

The production output is written to `dist/`.

## Deployment

### GitHub

Commit `package.json`, `package-lock.json`, source files, and `vercel.json`. Do not commit `node_modules/` or `dist/`.

### Vercel

Import the GitHub repository in Vercel. The included configuration uses `npm run build` and publishes `dist/`. No environment variables or server runtime are required.

## Architecture

- `src/game/core`: application composition and fixed-step loop
- `src/game/scenes`: scene lifecycle and menu/play orchestration
- `src/game/systems`: preserved gameplay simulation
- `src/game/rendering`: Canvas rendering
- `src/game/maps`: typed map data and loading
- `src/game/entities`: entity models
- `src/game/input`, `save`, `state`: platform services
- `src/game/ui`, `animation`, `camera`: presentation foundation
- `src/game/gameplay`, `systems`: reusable movement, combat, progression, and respawn contracts
- `src/game/debug`, `performance`: diagnostics
- `src/game/checkpoints`: reusable respawn state
- `src/editor`: internal asset browser, visual map editor, play-test bridge, storage, templates, and presets
- `assets`: future source assets
- `tools`: project validation scripts

See `docs/architecture.md` for the audit and migration rationale.
See `docs/visual-pipeline.md` for atlas ownership, animation timing, visual rules, and the character concept source prompt.
See `docs/gameplay-systems.md` for the core loop, save schema, and extension rules.
See `docs/map1-production.md` for Map 1 structure, enemy/hazard rules, progression, and shop behavior.
See `docs/art-direction-recovery.md` for the recovered visual language, asset rules, and source studies.
See `docs/editor-toolkit.md` for content authoring, play-test isolation, and map interchange.
