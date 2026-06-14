# Core gameplay systems

## Prototype scope

The active play scene is an internal systems yard, not Map 1. It contains static platforms, one jump gap leading to the void, one checkpoint door, four gold pickups, and a non-enemy training dummy. It intentionally contains no enemy, trap, final level content, shop logic, ranged attack, or combo system.

## Controls

- Move: `A`/`D` or left/right arrows
- Jump: `Space`, `W`, or up arrow
- Sword attack: `J` or `X`
- Pause: `Escape` or the HUD pause button
- Internal damage test: `K`

`InputSystem` exposes normalized actions and virtual-action setters, so touch controls can drive the same movement/combat contracts without changing gameplay systems.

## Movement

`PlayerMovementSystem` uses fixed-step delta time, acceleration, ground deceleration, lower air acceleration, maximum run/fall speeds, coyote time, jump buffering, variable jump height, and axis-separated platform collision. It returns landing and jump events for animation and effects without allocating entities.

## Combat

`CombatSystem` implements one quick sword swing with a startup, active hit window, recovery, cooldown, forward-facing hitbox, one-hit-per-swing protection, and interruption. The training dummy validates hit detection without introducing enemy behavior.

## Progression and flow

- Lives begin at 3.
- Generic damage sources call `PrototypeGameplaySystem.applyDamage(reason)`.
- Death enters a timed animation phase, then respawns at the latest checkpoint while lives remain.
- At 0 lives, flow enters Game Over.
- Restart Run restores 3 lives and clears checkpoint, gold, and collected-gold ownership.
- Pause Restart returns to the latest checkpoint without spending a life.
- Only the latest checkpoint is active.
- Collected gold IDs prevent duplicate pickup after reload.

## Save schema

Schema v3 persists selected character, legacy level index, lives, gold, collected gold IDs, checkpoint area/id, and future unlock IDs. Older saves migrate with safe defaults. Storage failures remain non-fatal.

## QA

`npm test` runs deterministic Vitest coverage for movement, air control, jump, attack windows, cooldown, life depletion, respawn transitions, latest-checkpoint ownership, gold deduplication, and save/reload behavior. Browser QA additionally verifies scene flow, HUD pause, death animation routing, reload persistence, Game Over, restart, and console cleanliness.
