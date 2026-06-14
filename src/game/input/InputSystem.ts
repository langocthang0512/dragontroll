const BLOCKED_KEYS = new Set([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"]);

export type GameAction = "left" | "right" | "jump" | "attack" | "pause";

const ACTION_KEYS: Record<GameAction, readonly string[]> = {
  left: ["a", "arrowleft"],
  right: ["d", "arrowright"],
  jump: [" ", "w", "arrowup"],
  attack: ["j", "x"],
  pause: ["escape"],
};

export interface PointerRelease {
  x: number;
  y: number;
}

export class InputSystem {
  private readonly down = new Set<string>();
  private readonly pressed = new Set<string>();
  private readonly virtualDown = new Set<GameAction>();
  private readonly virtualPressed = new Set<GameAction>();
  private pointerRelease?: PointerRelease;
  private canvas?: HTMLCanvasElement;

  constructor(private readonly target: Window = window) {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("blur", this.onBlur);
  }

  isDown(...keys: string[]): boolean {
    return keys.some((key) => this.down.has(key));
  }

  actionDown(action: GameAction): boolean {
    return this.virtualDown.has(action) || ACTION_KEYS[action].some((key) => this.down.has(key));
  }

  consumeAction(action: GameAction): boolean {
    if (this.virtualPressed.delete(action)) return true;
    for (const key of ACTION_KEYS[action]) {
      if (this.consume(key)) return true;
    }
    return false;
  }

  setVirtualAction(action: GameAction, active: boolean): void {
    if (active && !this.virtualDown.has(action)) this.virtualPressed.add(action);
    if (active) this.virtualDown.add(action);
    else this.virtualDown.delete(action);
  }

  attachPointer(canvas: HTMLCanvasElement): void {
    this.detachPointer();
    this.canvas = canvas;
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  consumePointerRelease(): PointerRelease | undefined {
    const release = this.pointerRelease;
    this.pointerRelease = undefined;
    return release;
  }

  consume(key: string): boolean {
    if (!this.pressed.has(key)) return false;
    this.pressed.delete(key);
    return true;
  }

  endFrame(): void {
    this.pressed.clear();
    this.virtualPressed.clear();
    this.pointerRelease = undefined;
  }

  dispose(): void {
    this.target.removeEventListener("keydown", this.onKeyDown);
    this.target.removeEventListener("keyup", this.onKeyUp);
    this.target.removeEventListener("blur", this.onBlur);
    this.detachPointer();
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
    this.virtualDown.clear();
    this.virtualPressed.clear();
    this.pointerRelease = undefined;
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.canvas) return;
    const bounds = this.canvas.getBoundingClientRect();
    this.pointerRelease = {
      x: (event.clientX - bounds.left) * (this.canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (this.canvas.height / bounds.height),
    };
  };

  private readonly onContextMenu = (event: Event): void => event.preventDefault();

  private detachPointer(): void {
    this.canvas?.removeEventListener("pointerup", this.onPointerUp);
    this.canvas?.removeEventListener("contextmenu", this.onContextMenu);
    this.canvas = undefined;
  }
}
