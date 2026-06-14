export type CharacterVariant = "male" | "female";

export type CharacterAnimationState = "idle" | "run" | "jump" | "fall" | "attack" | "damage" | "death";

export interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasAnimation {
  fps: number;
  loop: boolean;
  frames: AtlasFrame[];
}

export interface PlayerAtlasMetadata {
  frameWidth: number;
  frameHeight: number;
  imageWidth: number;
  imageHeight: number;
  variants: Record<CharacterVariant, Record<CharacterAnimationState, AtlasAnimation>>;
}
