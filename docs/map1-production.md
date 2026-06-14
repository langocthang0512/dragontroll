# Map 1 production

## Lost World

Map 1 is an original side-scrolling rainforest ruin built from code-native pixel primitives. The visual language uses layered canopy silhouettes, stone idols, broken architecture, vines, waterfalls, and warm gold accents. The referenced games informed atmosphere, readability, and movement hierarchy only; no source assets or layouts are reproduced.

The 7,200-pixel route is divided into eight authored sections: safe movement tutorial, simple platforming, first combat, falling-hazard introduction, checkpoint, mixed challenge, final approach, and the ancient goal gate. Gap widths remain inside the movement system's tested jump envelope.

## Enemies and hazards

Moss drakes patrol bounded lanes, detect the player within twice their body width, and fire a reusable white-orb projectile on a one-second cooldown. One readable sword hit defeats a drake. Projectiles come from a fixed pool, so combat does not allocate new objects during play.

Falling ruin eggs enter a telegraph state before dropping vertically. A highlighted lane and ground marker communicate the danger before gravity begins. Hazards reset and can be reused after reaching the floor.

## Progression

The ancient door remains the only active checkpoint and persists through reload. Reaching the final gate saves the `map-2-placeholder` unlock and opens the victory scene. Returning to the menu or replaying starts a fresh Map 1 run while retaining wallet gold.

The basic shop sells one life for 50 gold, up to the three-life cap. Gold persists after Game Over so the shop remains useful; collectible ownership resets for a new run.
