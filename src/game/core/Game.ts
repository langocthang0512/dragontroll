import { GAME_CONFIG } from "../../config/game";
import { AnimationController } from "../animation/AnimationController";
import { AssetLoader } from "../assets/AssetLoader";
import { assetManifest } from "../assets/manifest";
import { DebugTools } from "../debug/DebugTools";
import { InputSystem } from "../input/InputSystem";
import { levels } from "../maps/levels";
import { MapLoader } from "../maps/MapLoader";
import { PerformanceMonitor } from "../performance/PerformanceMonitor";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { LegacyWorldRenderer } from "../rendering/LegacyWorldRenderer";
import { SaveManager } from "../save/SaveManager";
import { MenuScene } from "../scenes/MenuScene";
import { PlayScene } from "../scenes/PlayScene";
import { SceneManager } from "../scenes/SceneManager";
import { GameStateManager } from "../state/GameStateManager";
import { LegacyGameplaySystem } from "../systems/LegacyGameplaySystem";
import { GameLoop } from "./GameLoop";

export class Game {
  private readonly assets = new AssetLoader();
  private readonly input = new InputSystem();
  private readonly animations = new AnimationController();
  private readonly maps = new MapLoader(levels);
  private readonly saves = new SaveManager(this.maps.count);
  private readonly savedGame = this.saves.load();
  private readonly state = new GameStateManager({
    mode: "menu",
    currentLevel: this.savedGame.currentLevel,
    deaths: 0,
    message: "Press ENTER to start",
    levelCleared: false,
  });
  private readonly renderer: CanvasRenderer;
  private readonly worldRenderer: LegacyWorldRenderer;
  private readonly gameplay: LegacyGameplaySystem;
  private readonly scenes = new SceneManager();
  private readonly debug = new DebugTools();
  private readonly performance = new PerformanceMonitor();
  private readonly loop: GameLoop;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas);
    this.worldRenderer = new LegacyWorldRenderer(this.renderer);
    this.gameplay = new LegacyGameplaySystem(
      this.input,
      this.maps,
      this.state,
      this.saves,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
    );
    this.gameplay.loadLevel(this.savedGame.currentLevel);

    this.scenes.register("menu", new MenuScene(
      this.input,
      this.gameplay,
      this.state,
      this.worldRenderer,
      () => this.scenes.start("play"),
    ));
    this.scenes.register("play", new PlayScene(
      this.input,
      this.maps,
      this.gameplay,
      this.state,
      this.worldRenderer,
      () => this.scenes.start("menu"),
    ));

    this.loop = new GameLoop({
      updatesPerSecond: GAME_CONFIG.updatesPerSecond,
      maxFrameDeltaMs: GAME_CONFIG.maxFrameDeltaMs,
      maxUpdatesPerFrame: GAME_CONFIG.maxUpdatesPerFrame,
      update: (deltaSeconds) => this.update(deltaSeconds),
      render: (interpolation) => this.render(interpolation),
      afterFrame: (timestamp, updates) => {
        this.performance.recordFrame(timestamp, updates);
        if (updates > 0) this.input.endFrame();
      },
    });
  }

  async start(): Promise<void> {
    await this.assets.loadAll(assetManifest);
    this.scenes.start("menu");
    this.loop.start();
    this.renderer.canvas.focus();
  }

  dispose(): void {
    this.loop.stop();
    this.scenes.dispose();
    this.animations.clear();
    this.assets.clear();
    this.input.dispose();
  }

  private update(deltaSeconds: number): void {
    if (this.input.consume("`")) this.debug.toggle();
    this.animations.update(deltaSeconds);
    this.scenes.update(deltaSeconds);
  }

  private render(interpolation: number): void {
    this.renderer.clear();
    this.scenes.render(interpolation);
    this.debug.render(
      this.renderer.context,
      this.renderer.ui,
      this.gameplay.level,
      this.gameplay.player,
      this.gameplay.camera.x,
      this.performance.snapshot,
    );
  }
}
