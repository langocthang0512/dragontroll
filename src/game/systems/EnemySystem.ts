import type { Player } from "../entities/Player";
import type { EnemyEntity } from "../gameplay/types";
import { intersects } from "../physics/collision";

export class EnemySystem {
  reset(enemies: readonly EnemyEntity[]): void {
    for (const enemy of enemies) {
      enemy.alive = true;
      enemy.hitCount = 0;
      enemy.flashRemaining = 0;
    }
  }

  update(enemies: readonly EnemyEntity[], player: Player, deltaSeconds: number): string | undefined {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      enemy.flashRemaining = Math.max(0, enemy.flashRemaining - deltaSeconds);
      const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
      const approaching = Math.abs(dx) <= enemy.w * 2.5 && Math.abs(player.y - enemy.y) < 70;
      if (approaching) enemy.direction = dx < 0 ? -1 : 1;

      const speed = approaching ? enemy.speed * 1.35 : enemy.speed;
      enemy.x += enemy.direction * speed * deltaSeconds;
      if (enemy.x <= enemy.patrolMin) enemy.direction = 1;
      if (enemy.x >= enemy.patrolMax) enemy.direction = -1;
      enemy.x = Math.max(enemy.patrolMin, Math.min(enemy.patrolMax, enemy.x));
      if (intersects(player, enemy)) return "DRAGON CONTACT  LIFE LOST";
    }
    return undefined;
  }

  defeat(enemies: readonly EnemyEntity[], enemyId: string): boolean {
    const enemy = enemies.find((item) => item.id === enemyId && item.alive);
    if (!enemy) return false;
    enemy.alive = false;
    enemy.flashRemaining = 0;
    return true;
  }
}
