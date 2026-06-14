const BLOCKED_KEYS = new Set([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

export class InputSystem {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();

  constructor(private readonly target: Window = window) {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("blur", this.onBlur);
  }

  isDown(...keys: string[]): boolean {
    return keys.some((key) => this.down.has(key));
  }

  consume(key: string): boolean {
    if (!this.pressed.has(key)) return false;
    this.pressed.delete(key);
    return true;
  }

  endFrame(): void {
    this.pressed.clear();
  }

  dispose(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.onBlur();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (!this.down.has(key)) this.pressed.add(key);
    this.down.add(key);
    if (BLOCKED_KEYS.has(key)) event.preventDefault();
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.down.delete(event.key.toLowerCase());
  };

  private readonly onBlur = (): void => {
    this.down.clear();
    this.pressed.clear();
  };
}
