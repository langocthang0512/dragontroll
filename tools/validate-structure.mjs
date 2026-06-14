import { access } from "node:fs/promises";

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
];

await Promise.all(requiredFiles.map((file) => access(file)));
console.log(`Architecture check passed (${requiredFiles.length} core modules).`);
