import "./styles.css";
import { Game } from "./game/core/Game";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Game canvas was not found.");

const game = new Game(canvas);
void game.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.dispose());
}
