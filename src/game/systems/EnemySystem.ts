import { GAMEPLAY_CONFIG } from "../../config/gameplay";
import type { Player } from "../entities/Player";
import type { EnemyEntity, EnemyProjectile } from "../gameplay/types";
import { intersects } from "../physics/collision";

const PROJECTILE_POOL_SIZE = 16;

export class EnemySystem {
  readonly projectiles: EnemyProjectile[] = Array.from({ length: PROJECTILE_POOL_SIZE }, () => ({
    x: 0, y: 0, w: 10, h: 10, vx: 0, active: false,
  }));

  reset(enemies: readonly EnemyEntity[]): void {
    for (const enemy of enemies) {
      enemy.alive = true;
      enemy.hitCount = 0;
      enemy.flashRemaining = 0;
      enemy.shootCooldownRemaining = 0.4;
    }
    for (const projectile of this.projectiles) projectile.active = false;
  }

  update(enemies: readonly EnemyEntity[], player: Player, deltaSeconds: number): string | undefined {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      enemy.flashRemaining = Math.max(0, enemy.flashRemaining - deltaSeconds);
      enemy.x += enemy.direction * enemy.speed * deltaSeconds;
      if (enemy.x <= enemy.patrolMin) enemy.direction = 1;
      if (enemy.x >= enemy.patrolMax) enemy.direction = -1;
      enemy.x = Math.max(enemy.patrolMin, Math.min(enemy.patrolMax, enemy.x));
      enemy.shootCooldownRemaining = Math.max(0, enemy.shootCooldownRemaining - deltaSeconds);

      const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
      const inRange = Math.abs(dx) <= enemy.w * 2 && Math.abs(player.y - enemy.y) < 70;
      if (inRange) {
        enemy.direction = dx < 0 ? -1 : 1;
        if (enemy.shootCooldownRemaining <= 0) {
          this.fire(enemy);
          enemy.shootCooldownRemaining = GAMEPLAY_CONFIG.enemyShootCooldown;
        }
      }
      if (intersects(player, enemy)) return "MOSS DRAKE HIT  LIFE LOST";
    }

    for (const projectile of this.projectiles) {
      if (!projectile.active) continue;
      projectile.x += projectile.vx * deltaSeconds;
      if (projectile.x < -80 || projectile.x > 7280) projectile.active = false;
      else if (intersects(player, projectile)) {
        projectile.active = false;
        return "WHITE ORB HIT  LIFE LOST";
      }
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

  clearProjectiles(): void {
    for (const projectile of this.projectiles) projectile.active = false;
  }

  private fire(enemy: EnemyEntity): void {
    const projectile = this.projectiles.find((item) => !item.active);
    if (!projectile) return;
    projectile.active = true;
    projectile.x = enemy.direction === 1 ? enemy.x + enemy.w : enemy.x - projectile.w;
    projectile.y = enemy.y + 14;
    projectile.vx = enemy.direction * GAMEPLAY_CONFIG.enemyProjectileSpeed;
  }
}
