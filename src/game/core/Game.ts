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
import { CharacterRenderer } from "../rendering/CharacterRenderer";
import { LegacyWorldRenderer } from "../rendering/LegacyWorldRenderer";
import { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import { SaveManager } from "../save/SaveManager";
import { CharacterSelectScene } from "../scenes/CharacterSelectScene";
import { LoadingScene } from "../scenes/LoadingScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { PauseScene } from "../scenes/PauseScene";
import { PlaceholderScene } from "../scenes/PlaceholderScene";
import { PlayScene } from "../scenes/PlayScene";
import { SceneManager } from "../scenes/SceneManager";
import { SettingsScene } from "../scenes/SettingsScene";
import { GameStateManager } from "../state/GameStateManager";
import { LegacyGameplaySystem } from "../systems/LegacyGameplaySystem";
import { ScreenTransition } from "../ui/ScreenTransition";
import { GameLoop } from "./GameLoop";

export class Game {
  private readonly assets = new AssetLoader();
  private readonly input = new InputSystem();
  private readonly animations = new AnimationController();
  private readonly maps = new MapLoader(levels);
  private readonly saves = new SaveManager(this.maps.count);
  private readonly savedGame = this.saves.load();
  private readonly state = new GameStateManager({
    mode: "loading",
    currentLevel: this.savedGame.currentLevel,
    deaths: 0,
    message: "Press ENTER to start",
    levelCleared: false,
    selectedCharacter: this.savedGame.selectedCharacter,
  });
  private readonly renderer: CanvasRenderer;
  private readonly worldRenderer: LegacyWorldRenderer;
  private readonly visualUI: VisualUIRenderer;
  private readonly gameplay: LegacyGameplaySystem;
  private readonly scenes = new SceneManager();
  private readonly debug = new DebugTools();
  private readonly performance = new PerformanceMonitor();
  private readonly loop: GameLoop;
  private readonly transition: ScreenTransition;
  private readonly loadingScene: LoadingScene;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas);
    const characterRenderer = new CharacterRenderer(this.renderer.context, this.assets);
    this.worldRenderer = new LegacyWorldRenderer(this.renderer, characterRenderer);
    this.visualUI = new VisualUIRenderer(this.renderer, characterRenderer);
    this.transition = new ScreenTransition(this.renderer.context, GAME_CONFIG.width, GAME_CONFIG.height);
    this.gameplay = new LegacyGameplaySystem(
      this.input,
      this.maps,
      this.state,
      this.saves,
      GAME_CONFIG.width,
      GAME_CONFIG.height,
    );
    this.gameplay.loadLevel(this.savedGame.currentLevel);

    const navigate = (scene: string): void => this.navigate(scene);
    this.loadingScene = new LoadingScene(this.state, this.visualUI);
    const playScene = new PlayScene(
      this.input,
      this.maps,
      this.gameplay,
      this.state,
      this.worldRenderer,
      () => navigate("pause"),
    );

    this.scenes.register("loading", this.loadingScene);
    this.scenes.register("menu", new MainMenuScene(
      this.input,
      this.gameplay,
      this.state,
      this.visualUI,
      navigate,
    ));
    this.scenes.register("settings", new SettingsScene(this.input, this.state, this.visualUI, navigate));
    this.scenes.register("character", new CharacterSelectScene(this.input, this.saves, this.state, this.visualUI, navigate));
    this.scenes.register("shop", new PlaceholderScene(
      this.input,
      this.visualUI,
      "SHOP",
      "SHOP SYSTEM RESERVED FOR A FUTURE MILESTONE",
      () => navigate("menu"),
    ));
    this.scenes.register("play", playScene);
    this.scenes.register("pause", new PauseScene(
      this.input,
      this.gameplay,
      this.state,
      this.visualUI,
      () => playScene.render(),
      navigate,
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
    this.scenes.start("loading");
    this.loop.start();
    this.renderer.canvas.focus();
    try {
      await this.assets.loadAll(assetManifest, (progress) => { this.loadingScene.progress = progress; });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      this.navigate("menu");
    } catch {
      this.loadingScene.error = "CHECK ASSET MANIFEST";
    }
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
    if (this.transition.active) this.transition.update(deltaSeconds);
    else this.scenes.update(deltaSeconds);
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
    this.transition.render();
  }

  private navigate(scene: string): void {
    this.transition.start(() => this.scenes.start(scene));
  }
}
