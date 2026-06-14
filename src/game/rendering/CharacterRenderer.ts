import type { AssetLoader } from "../assets/AssetLoader";
import { PLAYER_ATLAS_DATA, PLAYER_ATLAS_IMAGE } from "../assets/manifest";
import type { SpriteAnimator } from "../animation/SpriteAnimator";
import type { CharacterVariant, PlayerAtlasMetadata } from "../animation/types";

export class CharacterRenderer {
  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly assets: AssetLoader,
  ) {}

  render(
    variant: CharacterVariant,
    animator: SpriteAnimator,
    x: number,
    y: number,
    face: -1 | 1 = 1,
    scale = 1,
  ): void {
    const image = this.assets.get<HTMLImageElement>(PLAYER_ATLAS_IMAGE);
    const metadata = this.assets.get<PlayerAtlasMetadata>(PLAYER_ATLAS_DATA);
    const animation = metadata.variants[variant][animator.currentState];
    const frame = animator.frame(animation);
    const width = frame.w * scale;
    const height = frame.h * scale;

    this.context.save();
    this.context.translate(Math.round(x), Math.round(y));
    if (face === -1) this.context.scale(-1, 1);
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(image, frame.x, frame.y, frame.w, frame.h, -width / 2, -height, width, height);
    this.context.restore();
  }
}
