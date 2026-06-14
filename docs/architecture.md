# Architecture audit and migration

## Legacy audit

The original project was one 23 KB `index.html` containing CSS, five level definitions, the simulation, rendering, input, UI, and persistence. It rendered directly through a 960x540 Canvas 2D context and started an unbounded `requestAnimationFrame` loop. State lived in mutable globals; level resets used JSON serialization to clone data; assets were procedural rectangles with no loading pipeline; saves were a single numeric `localStorage` value; deployment was static-file hosting with no build validation.

The implementation was playable and dependency-free, but every subsystem shared the same scope. The largest risks were frame-rate-dependent physics, mutation during collision loops, repeated global listeners, unvalidated storage access, expensive full-level JSON cloning, no scene cleanup contract, and no automated build or deployment check. The renderer traversed every object each frame, which is acceptable at the current map size but will need viewport culling as content grows.

## Engine decision

- Framework: custom modular game runtime
- Renderer: Canvas 2D with a fixed logical resolution
- Language: strict TypeScript
- Build: Vite
- Save: versioned localStorage with legacy-key migration
- Deployment: static `dist/` output for GitHub and Vercel

Phaser and PixiJS were considered. They would add useful tooling later, but neither solves the current coupling by itself, and adopting one now would force a higher-risk rewrite of working collision and drawing behavior. Canvas 2D comfortably handles the current object count and procedural art. The new boundaries allow a future renderer or physics replacement without changing saves, maps, scenes, or input.

## Migration path

1. Preserve all level data and player-facing behavior.
2. Introduce typed services and a fixed 60 Hz loop around the legacy rules.
3. Separate simulation, map loading, rendering, UI, input, saves, scenes, camera, checkpoints, and diagnostics.
4. Keep the legacy save key synchronized while writing a versioned save document.
5. Add build, type, structure, browser, and deployment verification.

Future development should add gameplay through systems and typed map data rather than expanding the application composer. External art should enter through the asset manifest. Spatial indexing and sprite batching should only be introduced when profiling shows the current traversal is a real bottleneck.

## Visual foundation milestone

The second milestone added a generated-at-build character atlas, JSON animation metadata, character state machines, persistent profile selection, bitmap UI primitives, dedicated visual scenes, pixel-safe camera smoothing, and screen transitions. The Canvas 2D architecture remains appropriate: the full character set is one small texture, UI primitives allocate no per-frame DOM, and the existing renderer can be replaced independently if future profiling justifies WebGL.

## Core gameplay milestone

The third milestone replaced the active legacy play path with a modular internal test yard. Movement, combat, lives, gold, checkpoints, respawn phases, run persistence, HUD, pause, and Game Over are independent systems composed by `PrototypeGameplaySystem`. Legacy level data remains in the repository for migration safety but is not imported into the production bundle or used by the prototype scene.

## Playable Build V1 milestone

The fourth milestone promotes those systems into the complete Lost World Map 1 without changing the runtime architecture. Typed map data owns eight level sections, terrain, collectibles, enemy placements, hazards, decorations, checkpoint, and goal. `EnemySystem` uses a fixed projectile pool, while `FallingHazardSystem` owns explicit idle, telegraph, and falling states. Victory and shop are scenes, not gameplay-system branches, and the Canvas renderer culls world objects outside a padded viewport.
