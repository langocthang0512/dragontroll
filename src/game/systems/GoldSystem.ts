import type { GoldPickup } from "../gameplay/types";
import type { Player } from "../entities/Player";
import { intersects } from "../physics/collision";

export class GoldSystem {
  private total = 0;
  private readonly collectedIds = new Set<string>();

  get gold(): number {
    return this.total;
  }

  get collected(): string[] {
    return [...this.collectedIds];
  }

  restore(total: number, collectedIds: readonly string[], pickups: GoldPickup[]): void {
    this.total = Math.max(0, Math.trunc(total));
    this.collectedIds.clear();
    for (const id of collectedIds) this.collectedIds.add(id);
    for (const pickup of pickups) pickup.collected = this.collectedIds.has(pickup.id);
  }

  reset(pickups: GoldPickup[], preserveTotal = false): void {
    if (!preserveTotal) this.total = 0;
    this.collectedIds.clear();
    for (const pickup of pickups) pickup.collected = false;
  }

  spend(amount: number): boolean {
    const price = Math.max(0, Math.trunc(amount));
    if (this.total < price) return false;
    this.total -= price;
    return true;
  }

  collect(player: Player, pickups: GoldPickup[]): number {
    let gained = 0;
    for (const pickup of pickups) {
      if (pickup.collected || !intersects(player, pickup)) continue;
      pickup.collected = true;
      this.collectedIds.add(pickup.id);
      this.total += pickup.value;
      gained += pickup.value;
    }
    return gained;
  }
}
