# Visual foundation and pixel pipeline

## Direction

The visual target is a modern pixel platformer with compact silhouettes, restrained color ramps, consistent top-left lighting, and readable anticipation and follow-through. Apple Knight was used only as a readability and motion-quality reference. No reference assets, characters, layouts, or animation frames were reproduced.

## Asset workflow

- Runtime format: one transparent RGBA PNG atlas plus JSON metadata
- Frame size: 64x64 pixels, authored on a 32x32 design grid at 2x scale
- Sampling: nearest-neighbor only
- Variants: male and female share body geometry, equipment, palette, timing, and hitbox; only hair pixels differ
- Loading: atlas image and metadata are loaded once through `AssetLoader`
- Source of truth: `tools/generate-player-atlas.mjs`
- Rebuild command: `npm run assets:build`
- Runtime atlas: `assets/player/player-atlas.png`
- Runtime metadata: `assets/animation/player-atlas.json`
- Visual concept source: `assets/temp/character-concept.png` (not shipped by the asset manifest)

Animation states are `idle` (4 frames at 7 fps), `run` (6 at 12 fps), `jump` (2 at 8 fps), `fall` (2 at 8 fps), `attack` (5 at 15 fps), `damage` (2 at 10 fps), and `death` (5 at 8 fps). The selection screen cycles every state for production review. Gameplay currently drives only locomotion states; combat behavior remains intentionally unimplemented.

## UI workflow

The UI uses reusable pixel panels, buttons, progress bars, focus markers, and a code-owned 5x7 bitmap font. This prevents browser font smoothing from mixing visual styles and keeps menu assets small. Loading, main menu, settings, character selection, pause, and placeholder screens are independent scenes with cleanup-safe input.

## Camera and transitions

The camera follows a constrained target with exponential smoothing and rounds output to whole pixels. Scene changes use a short full-screen fade without blur, particles, or persistent allocations.

## Concept generation prompt

The concept source was generated with the built-in image generation tool and normalized into the deterministic production atlas. Final prompt:

> Original compact fantasy platformer hero sprite-sheet concept with male and female variants sharing body, armor, proportions, palette, and movement language, differing only in hair. Show idle, run, jump, fall, sword attack, damage, and death in crisp limited-palette pixel art with consistent top-left lighting on a flat magenta chroma background. No copied assets, text, logos, blur, gradients, mixed styles, or watermark.
