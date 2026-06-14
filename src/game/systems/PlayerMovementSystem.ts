import { GAMEPLAY_CONFIG } from "../../config/gameplay";
import type { Player } from "../entities/Player";
import type { MovementInput, StaticPlatform } from "../gameplay/types";
import { intersects } from "../physics/collision";

export interface MovementResult {
  landed: boolean;
  jumped: boolean;
}

export class PlayerMovementSystem {
  private coyoteRemaining = 0;
  private jumpBufferRemaining = 0;

  reset(): void {
    this.coyoteRemaining = 0;
    this.jumpBufferRemaining = 0;
  }

  update(player: Player, input: MovementInput, platforms: readonly StaticPlatform[], deltaSeconds: number): MovementResult {
    const wasGrounded = player.ground;
    player.wasGrounded = wasGrounded;
    this.coyoteRemaining = wasGrounded
      ? GAMEPLAY_CONFIG.coyoteTime
      : Math.max(0, this.coyoteRemaining - deltaSeconds);
    this.jumpBufferRemaining = input.jumpPressed
      ? GAMEPLAY_CONFIG.jumpBufferTime
      : Math.max(0, this.jumpBufferRemaining - deltaSeconds);

    const acceleration = wasGrounded ? GAMEPLAY_CONFIG.groundAcceleration : GAMEPLAY_CONFIG.airAcceleration;
    if (input.horizontal !== 0) {
      player.vx = this.moveToward(player.vx, input.horizontal * GAMEPLAY_CONFIG.maxRunSpeed, acceleration * deltaSeconds);
      player.face = input.horizontal;
    } else if (wasGrounded) {
      player.vx = this.moveToward(player.vx, 0, GAMEPLAY_CONFIG.groundDeceleration * deltaSeconds);
    }

    let jumped = false;
    if (this.jumpBufferRemaining > 0 && this.coyoteRemaining > 0) {
      player.vy = -GAMEPLAY_CONFIG.jumpSpeed;
      player.ground = false;
      this.coyoteRemaining = 0;
      this.jumpBufferRemaining = 0;
      jumped = true;
    }
    if (!input.jumpHeld && player.vy < -GAMEPLAY_CONFIG.jumpSpeed * 0.45) {
      player.vy = -GAMEPLAY_CONFIG.jumpSpeed * 0.45;
    }

    player.x += player.vx * deltaSeconds;
    for (const platform of platforms) {
      if (!intersects(player, platform)) continue;
      if (player.vx > 0) player.x = platform.x - player.w;
      if (player.vx < 0) player.x = platform.x + platform.w;
      player.vx = 0;
    }

    player.vy = Math.min(GAMEPLAY_CONFIG.maxFallSpeed, player.vy + GAMEPLAY_CONFIG.gravity * deltaSeconds);
    player.y += player.vy * deltaSeconds;
    player.ground = false;
    for (const platform of platforms) {
      if (!intersects(player, platform)) continue;
      if (player.vy > 0) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.ground = true;
      } else if (player.vy < 0) {
        player.y = platform.y + platform.h;
        player.vy = 0;
      }
    }

    return { landed: !wasGrounded && player.ground, jumped };
  }

  private moveToward(value: number, target: number, maxDelta: number): number {
    if (value < target) return Math.min(value + maxDelta, target);
    if (value > target) return Math.max(value - maxDelta, target);
    return target;
  }
}
