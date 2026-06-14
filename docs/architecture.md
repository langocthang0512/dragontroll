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
