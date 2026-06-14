import { GAMEPLAY_CONFIG } from "../../config/gameplay";
import { CharacterAnimationStateMachine } from "../animation/CharacterAnimationStateMachine";
import type { InputSystem } from "../input/InputSystem";
import { containsPoint } from "../physics/collision";
import { PAUSE_BUTTON, type PrototypeWorldRenderer } from "../rendering/PrototypeWorldRenderer";
import type { GameStateManager } from "../state/GameStateManager";
import type { PrototypeGameplaySystem } from "../systems/PrototypeGameplaySystem";
import type { Scene } from "./Scene";

export class PlayScene implements Scene {
  private readonly characterAnimation = new CharacterAnimationStateMachine();

  constructor(
    private readonly input: InputSystem,
    private readonly gameplay: PrototypeGameplaySystem,
    private readonly state: GameStateManager,
    private readonly renderer: PrototypeWorldRenderer,
    private readonly openPause: () => void,
    private readonly openGameOver: () => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "playing", runFlow: this.gameplay.respawn.state });
  }

  exit(): void {}

  update(deltaSeconds: number): void {
    const pointer = this.input.consumePointerRelease();
    if (this.input.consumeAction("pause") || (pointer && containsPoint(PAUSE_BUTTON, pointer.x, pointer.y))) {
      this.openPause();
      return;
    }

    const events = this.gameplay.update(deltaSeconds);
    if (events.attackStarted) this.characterAnimation.playOnce("attack", GAMEPLAY_CONFIG.attackDuration);
    if (events.deathStarted) this.characterAnimation.playOnce("death", GAMEPLAY_CONFIG.deathDuration);
    this.characterAnimation.update(deltaSeconds, this.gameplay.player);
    if (events.gameOver) this.openGameOver();
  }

  render(): void {
    this.renderer.render(this.gameplay, this.state.snapshot, this.characterAnimation.animator);
  }
}
