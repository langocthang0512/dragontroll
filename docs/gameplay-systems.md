# Core gameplay systems

## Playable Build V1 scope

The active play scene is the complete Lost World Map 1. The original prototype systems now compose authored level data, moss drake enemies, pooled white-orb projectiles, telegraphed falling hazards, one persistent checkpoint, collectible gold, a final goal, victory flow, and the basic life shop. Map 2 and audio remain outside this milestone.

## Controls

- Move: `A`/`D` or left/right arrows
- Jump: `Space`, `W`, or up arrow
- Sword attack: `J` or `X`
- Pause: `Escape` or the HUD pause button

`InputSystem` exposes normalized actions and virtual-action setters, so touch controls can drive the same movement/combat contracts without changing gameplay systems.

## Movement

`PlayerMovementSystem` uses fixed-step delta time, acceleration, ground deceleration, lower air acceleration, maximum run/fall speeds, coyote time, jump buffering, variable jump height, and axis-separated platform collision. It returns landing and jump events for animation and effects without allocating entities.

## Combat

`CombatSystem` implements one quick sword swing with startup, an active hit window, recovery, cooldown, a forward-facing hitbox, one-hit-per-swing protection, and interruption. It accepts reusable target lists; Map 1 uses one-hit moss drakes.

## Progression and flow

- Lives begin at 3.
- Generic damage sources call `PrototypeGameplaySystem.applyDamage(reason)`.
- Death enters a timed animation phase, then respawns at the latest checkpoint while lives remain.
- At 0 lives, flow enters Game Over.
- Restart Run restores 3 lives and clears checkpoint and collected-gold ownership while preserving wallet gold.
- Pause Restart returns to the latest checkpoint without spending a life.
- Only the latest checkpoint is active.
- Collected gold IDs prevent duplicate pickup after reload.

## Save schema

Schema v3 persists selected character, legacy level index, lives, gold, collected gold IDs, checkpoint area/id, and future unlock IDs. Older saves migrate with safe defaults. Storage failures remain non-fatal.

## QA

`npm test` runs deterministic Vitest coverage for movement, combat targeting, enemy fire/defeat, hazard telegraph/drop/reset, Map 1 structure, life depletion, respawn transitions, checkpoint ownership, shop economy, gold deduplication, and save/reload behavior. Browser QA verifies the complete menu-to-victory flow, HUD pause, checkpoint reload, Game Over, shop purchase states, restart, and console cleanliness.
