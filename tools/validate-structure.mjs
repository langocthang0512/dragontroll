import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "src/game/assets/AssetLoader.ts",
  "src/game/scenes/SceneManager.ts",
  "src/game/state/GameStateManager.ts",
  "src/game/save/SaveManager.ts",
  "src/game/input/InputSystem.ts",
  "src/game/ui/UIFramework.ts",
  "src/game/animation/AnimationController.ts",
  "src/game/camera/CameraSystem.ts",
  "src/game/debug/DebugTools.ts",
  "src/game/performance/PerformanceMonitor.ts",
  "src/game/checkpoints/CheckpointSystem.ts",
  "src/game/maps/MapLoader.ts",
  "src/game/rendering/CharacterRenderer.ts",
  "src/game/rendering/VisualUIRenderer.ts",
  "src/game/animation/SpriteAnimator.ts",
  "src/game/scenes/CharacterSelectScene.ts",
  "src/game/scenes/GameOverScene.ts",
  "src/game/scenes/ShopScene.ts",
  "src/game/scenes/VictoryScene.ts",
  "src/game/systems/PlayerMovementSystem.ts",
  "src/game/systems/CombatSystem.ts",
  "src/game/systems/LivesSystem.ts",
  "src/game/systems/RespawnSystem.ts",
  "src/game/systems/GoldSystem.ts",
  "src/game/systems/PrototypeGameplaySystem.ts",
  "src/game/systems/EnemySystem.ts",
  "src/game/systems/FallingHazardSystem.ts",
  "src/game/rendering/PrototypeWorldRenderer.ts",
  "src/game/maps/map1.ts",
  "src/game/maps/testArea.ts",
  "assets/player/player-atlas.png",
  "assets/animation/player-atlas.json",
];

await Promise.all(requiredFiles.map((file) => access(file)));

const requiredStates = ["idle", "run", "jump", "fall", "attack", "damage", "death"];
const metadata = JSON.parse(await readFile("assets/animation/player-atlas.json", "utf8"));
for (const state of requiredStates) {
  const male = metadata.variants?.male?.[state];
  const female = metadata.variants?.female?.[state];
  if (!male || !female || male.frames.length === 0 || female.frames.length === 0) {
    throw new Error(`Missing character animation state: ${state}`);
  }
  if (male.fps !== female.fps || male.loop !== female.loop || male.frames.length !== female.frames.length) {
    throw new Error(`Character timing mismatch: ${state}`);
  }
}

const png = await readFile("assets/player/player-atlas.png");
const pngSignature = "89504e470d0a1a0a";
if (png.subarray(0, 8).toString("hex") !== pngSignature) throw new Error("Player atlas is not a PNG.");
if (png.readUInt32BE(16) !== metadata.imageWidth || png.readUInt32BE(20) !== metadata.imageHeight) {
  throw new Error("Player atlas dimensions do not match metadata.");
}
if (png[25] !== 6) throw new Error("Player atlas must use RGBA color data.");

console.log(`Architecture, visual, and gameplay pipeline checks passed (${requiredFiles.length} required files).`);
