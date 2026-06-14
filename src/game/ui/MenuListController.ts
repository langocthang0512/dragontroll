import type { InputSystem } from "../input/InputSystem";

export interface MenuOption {
  id: string;
  label: string;
  disabled?: boolean;
}

export class MenuListController {
  selectedIndex = 0;

  constructor(readonly options: readonly MenuOption[]) {
    this.ensureEnabledSelection(1);
  }

  update(input: InputSystem): string | undefined {
    if (input.consume("arrowup") || input.consume("w")) this.move(-1);
    if (input.consume("arrowdown") || input.consume("s")) this.move(1);
    if (!input.consume("enter")) return undefined;
    const option = this.options[this.selectedIndex];
    return option?.disabled ? undefined : option?.id;
  }

  reset(index = 0): void {
    this.selectedIndex = Math.max(0, Math.min(this.options.length - 1, index));
    this.ensureEnabledSelection(1);
  }

  private move(direction: -1 | 1): void {
    if (this.options.length === 0) return;
    this.selectedIndex = (this.selectedIndex + direction + this.options.length) % this.options.length;
    this.ensureEnabledSelection(direction);
  }

  private ensureEnabledSelection(direction: -1 | 1): void {
    for (let count = 0; count < this.options.length; count++) {
      if (!this.options[this.selectedIndex]?.disabled) return;
      this.selectedIndex = (this.selectedIndex + direction + this.options.length) % this.options.length;
    }
  }
}
