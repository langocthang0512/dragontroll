import { GAME_CONFIG } from "../../config/game";
import { DeveloperToolkit } from "../../editor/DeveloperToolkit";
import { areaToEditorMap } from "../../editor/maps/map1Document";
import { AnimationController } from "../animation/AnimationController";
import { AssetLoader } from "../assets/AssetLoader";
import { assetManifest } from "../assets/manifest";
import { DebugTools } from "../debug/DebugTools";
import { InputSystem } from "../input/InputSystem";
import { PerformanceMonitor } from "../performance/PerformanceMonitor";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { CharacterRenderer } from "../rendering/CharacterRenderer";
import { PrototypeWorldRenderer } from "../rendering/PrototypeWorldRenderer";
import { VisualUIRenderer } from "../rendering/VisualUIRenderer";
import { SaveManager } from "../save/SaveManager";
import { CharacterSelectScene } from "../scenes/CharacterSelectScene";
import { GameOverScene } from "../scenes/GameOverScene";
import { LoadingScene } from "../scenes/LoadingScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { PauseScene } from "../scenes/PauseScene";
import { PlayScene } from "../scenes/PlayScene";
import { SceneManager } from "../scenes/SceneManager";
import { SettingsScene } from "../scenes/SettingsScene";
import { ShopScene } from "../scenes/ShopScene";
import { VictoryScene } from "../scenes/VictoryScene";
import { GameStateManager } from "../state/GameStateManager";
import { PrototypeGameplaySystem } from "../systems/PrototypeGameplaySystem";
import { ScreenTransition } from "../ui/ScreenTransition";
import { GameLoop } from "./GameLoop";

export class Game {
  private readonly assets = new AssetLoader();
  private readonly input = new InputSystem();
  private readonly animations = new AnimationController();
  private readonly saves = new SaveManager(5);
  private readonly savedGame = this.saves.load();
  private readonly state = new GameStateManager({
    mode: "loading",
    currentLevel: this.savedGame.currentLevel,
    deaths: 0,
    message: "Press ENTER to start",
    levelCleared: false,
    selectedCharacter: this.savedGame.selectedCharacter,
    lives: this.savedGame.run.lives,
    gold: this.savedGame.run.gold,
    runFlow: this.savedGame.run.lives > 0 ? "spawn" : "gameOver",
  });
  private readonly renderer: CanvasRenderer;
  private readonly worldRenderer: PrototypeWorldRenderer;
  private readonly visualUI: VisualUIRenderer;
  private readonly gameplay: PrototypeGameplaySystem;
  private readonly editor: DeveloperToolkit;
  private readonly scenes = new SceneManager();
  private readonly debug = new DebugTools();
  private readonly performance = new PerformanceMonitor();
  private readonly loop: GameLoop;
  private readonly transition: ScreenTransition;
  private readonly loadingScene: LoadingScene;
  private readonly unsubscribeState: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas);
    this.input.attachPointer(canvas);
    this.unsubscribeState = this.state.subscribe((state) => this.syncCanvasState(state));
    this.syncCanvasState(this.state.snapshot);
    const characterRenderer = new CharacterRenderer(this.renderer.context, this.assets);
    this.worldRenderer = new PrototypeWorldRenderer(this.renderer, characterRenderer, this.assets);
    this.visualUI = new VisualUIRenderer(this.renderer, characterRenderer);
    this.transition = new ScreenTransition(this.renderer.context, GAME_CONFIG.width, GAME_CONFIG.height);
    this.gameplay = new PrototypeGameplaySystem(
      this.input,
      this.state,
      this.saves,
      GAME_CONFIG.width,
    );
    this.editor = new DeveloperToolkit(canvas.parentElement ?? document.body, areaToEditorMap(this.gameplay.area), {
      play: (area) => {
        this.gameplay.beginEditorPlaytest(area);
        this.scenes.start("play");
        this.renderer.canvas.focus();
      },
      stopPlay: () => {
        this.gameplay.endEditorPlaytest();
        this.scenes.start("menu");
      },
      exit: () => this.renderer.canvas.focus(),
    });

    const navigate = (scene: string): void => this.navigate(scene);
    this.loadingScene = new LoadingScene(this.state, this.visualUI);
    const playScene = new PlayScene(
      this.input,
      this.gameplay,
      this.state,
      this.worldRenderer,
      () => navigate("pause"),
      () => navigate("gameOver"),
      () => this.gameplay.isEditorPlaytest ? this.editor.open() : navigate("victory"),
    );

    this.scenes.register("loading", this.loadingScene);
    this.scenes.register("menu", new MainMenuScene(
      this.input,
      this.gameplay,
      this.state,
      this.visualUI,
      navigate,
      () => this.editor.open(),
    ));
    this.scenes.register("settings", new SettingsScene(this.input, this.state, this.visualUI, navigate));
    this.scenes.register("character", new CharacterSelectScene(this.input, this.saves, this.state, this.visualUI, navigate));
    this.scenes.register("shop", new ShopScene(this.input, this.gameplay, this.state, this.visualUI, navigate));
    this.scenes.register("gameOver", new GameOverScene(this.input, this.gameplay, this.state, this.visualUI, navigate));
    this.scenes.register("victory", new VictoryScene(this.input, this.gameplay, this.state, this.visualUI, navigate));
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
    this.editor.dispose();
    this.input.dispose();
    this.unsubscribeState();
  }

  private update(deltaSeconds: number): void {
    if (this.input.consumeEditorShortcut()) {
      this.editor.toggle();
      return;
    }
    if (this.editor.isOpen) return;
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
      undefined,
      this.gameplay.player,
      this.gameplay.camera.x,
      this.performance.snapshot,
    );
    this.transition.render();
  }

  private navigate(scene: string): void {
    this.transition.start(() => this.scenes.start(scene));
  }

  private syncCanvasState(state: Readonly<import("../state/GameStateManager").GameState>): void {
    const { canvas } = this.renderer;
    canvas.dataset.gameMode = state.mode;
    canvas.dataset.runFlow = state.runFlow;
    canvas.dataset.lives = String(state.lives);
    canvas.dataset.gold = String(state.gold);
    canvas.dataset.character = state.selectedCharacter;
    canvas.dataset.levelCleared = String(state.levelCleared);
  }
}
