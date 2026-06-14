import { SpriteAnimator } from "../animation/SpriteAnimator";
import type { CharacterAnimationState, CharacterVariant } from "../animation/types";
import type { InputSystem } from "../input/InputSystem";
import type { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import type { SaveManager } from "../save/SaveManager";
import type { GameStateManager } from "../state/GameStateManager";
import type { Scene } from "./Scene";

const PREVIEW_STATES: readonly CharacterAnimationState[] = ["idle", "run", "jump", "fall", "attack", "damage", "death"];

export class CharacterSelectScene implements Scene {
  private selected: CharacterVariant = "male";
  private readonly male = new SpriteAnimator();
  private readonly female = new SpriteAnimator();
  private previewIndex = 0;
  private previewElapsed = 0;

  constructor(
    private readonly input: InputSystem,
    private readonly saves: SaveManager,
    private readonly state: GameStateManager,
    private readonly renderer: VisualUIRenderer,
    private readonly navigate: (scene: string) => void,
  ) {}

  enter(): void {
    this.state.patch({ mode: "character" });
    this.selected = this.state.snapshot.selectedCharacter;
    this.previewIndex = 0;
    this.previewElapsed = 0;
    this.applyPreviewState(true);
  }

  exit(): void {}

  update(deltaSeconds: number): void {
    if (this.input.consume("arrowleft") || this.input.consume("a")) this.selected = "male";
    if (this.input.consume("arrowright") || this.input.consume("d")) this.selected = "female";
    if (this.input.consume("escape")) return this.navigate("settings");
    if (this.input.consume("enter")) {
      this.saves.saveCharacter(this.selected);
      this.state.patch({ selectedCharacter: this.selected });
      this.navigate("settings");
      return;
    }

    this.previewElapsed += deltaSeconds;
    if (this.previewElapsed >= 1.05) {
      this.previewElapsed = 0;
      this.previewIndex = (this.previewIndex + 1) % PREVIEW_STATES.length;
      this.applyPreviewState(true);
    }
    this.male.update(deltaSeconds);
    this.female.update(deltaSeconds);
  }

  render(): void {
    this.renderer.characterSelect(this.selected, PREVIEW_STATES[this.previewIndex], this.male, this.female);
  }

  private applyPreviewState(restart: boolean): void {
    const state = PREVIEW_STATES[this.previewIndex];
    this.male.setState(state, restart);
    this.female.setState(state, restart);
  }
}
