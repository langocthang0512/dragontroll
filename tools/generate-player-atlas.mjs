import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const DESIGN_SIZE = 32;
const SCALE = 2;
const FRAME_SIZE = DESIGN_SIZE * SCALE;
const COLUMNS = 8;
const STATES = [
  ["idle", 4, 7, true],
  ["run", 6, 12, true],
  ["jump", 2, 8, false],
  ["fall", 2, 8, true],
  ["attack", 5, 15, false],
  ["damage", 2, 10, false],
  ["death", 5, 8, false],
];
const VARIANTS = ["male", "female"];
const FRAMES_PER_VARIANT = STATES.reduce((total, [, count]) => total + count, 0);
const ROWS_PER_VARIANT = Math.ceil(FRAMES_PER_VARIANT / COLUMNS);
const WIDTH = COLUMNS * FRAME_SIZE;
const HEIGHT = ROWS_PER_VARIANT * VARIANTS.length * FRAME_SIZE;
const pixels = new Uint8Array(WIDTH * HEIGHT * 4);

const palette = {
  outline: "#171827",
  hairDark: "#3a241b",
  hair: "#6b4027",
  hairLight: "#98613a",
  skin: "#f0aa72",
  skinLight: "#ffd09a",
  navyDark: "#172840",
  navy: "#29496b",
  navyLight: "#3d6b8d",
  leatherDark: "#4a2c1a",
  leather: "#8a5630",
  leatherLight: "#c17b3e",
  steel: "#a9b8c4",
  steelLight: "#e9f1f3",
  damage: "#f05b61",
};

function color(hex) {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
    255,
  ];
}

function setPixel(x, y, rgba) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  pixels.set(rgba, (y * WIDTH + x) * 4);
}

function createPainter(frameIndex) {
  const frameX = (frameIndex % COLUMNS) * FRAME_SIZE;
  const frameY = Math.floor(frameIndex / COLUMNS) * FRAME_SIZE;
  const rect = (x, y, width, height, fill) => {
    const rgba = color(fill);
    for (let py = y * SCALE; py < (y + height) * SCALE; py++) {
      for (let px = x * SCALE; px < (x + width) * SCALE; px++) setPixel(frameX + px, frameY + py, rgba);
    }
  };
  const line = (x0, y0, x1, y1, thickness, fill) => {
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      rect(x0 - Math.floor(thickness / 2), y0 - Math.floor(thickness / 2), thickness, thickness, fill);
      if (x0 === x1 && y0 === y1) break;
      const twiceError = 2 * error;
      if (twiceError >= dy) { error += dy; x0 += sx; }
      if (twiceError <= dx) { error += dx; y0 += sy; }
    }
  };
  return { rect, line };
}

function drawHair(p, variant, x, y) {
  p.rect(x - 1, y, 10, 2, palette.outline);
  p.rect(x - 2, y + 2, 11, 4, palette.outline);
  p.rect(x, y, 7, 2, palette.hairLight);
  p.rect(x - 1, y + 2, 9, 4, palette.hair);
  p.rect(x - 1, y + 5, 3, 3, palette.hairDark);
  p.rect(x + 6, y + 4, 3, 3, palette.hairDark);
  if (variant === "male") {
    p.rect(x, y - 2, 2, 2, palette.outline);
    p.rect(x + 3, y - 3, 2, 3, palette.outline);
    p.rect(x + 6, y - 2, 2, 2, palette.outline);
    p.rect(x + 1, y - 1, 1, 1, palette.hairLight);
    p.rect(x + 4, y - 2, 1, 2, palette.hair);
    p.rect(x + 7, y - 1, 1, 1, palette.hair);
  } else {
    p.rect(x - 4, y + 3, 4, 3, palette.outline);
    p.rect(x - 6, y + 5, 4, 4, palette.outline);
    p.rect(x - 3, y + 4, 3, 2, palette.hair);
    p.rect(x - 5, y + 6, 3, 2, palette.hairLight);
    p.rect(x + 6, y + 5, 3, 5, palette.hairDark);
  }
}

function drawSword(p, bodyX, bodyY, state, phase) {
  const attackPositions = [[12, -2], [18, 1], [21, 7], [19, 13], [14, 17]];
  const startX = bodyX + 14;
  const startY = bodyY + 9;
  let endX = bodyX + 20;
  let endY = bodyY + 17;
  if (state === "attack") [endX, endY] = [bodyX + attackPositions[phase][0], bodyY + attackPositions[phase][1]];
  if (state === "jump") [endX, endY] = [bodyX + 20, bodyY + 2];
  if (state === "fall") [endX, endY] = [bodyX + 21, bodyY + 11];
  p.line(startX, startY, endX, endY, 3, palette.outline);
  p.line(startX, startY, endX, endY, 1, palette.steelLight);
  p.rect(startX - 1, startY - 1, 4, 2, palette.leatherLight);
}

function drawStandingCharacter(p, variant, state, phase) {
  const runSwing = state === "run" ? [-2, -1, 1, 2, 1, -1][phase] : 0;
  const idleBob = state === "idle" ? [0, 0, -1, 0][phase] : 0;
  const bodyX = 10 + (state === "damage" ? 2 : 0) + (state === "attack" && phase > 1 ? 1 : 0);
  const bodyY = 11 + idleBob + (state === "jump" ? -2 : 0) + (state === "fall" ? -1 : 0);
  const leftLeg = state === "run" ? runSwing : state === "jump" ? 2 : state === "fall" ? -1 : 0;
  const rightLeg = state === "run" ? -runSwing : state === "jump" ? -1 : state === "fall" ? 2 : 0;

  p.rect(bodyX + 1 + leftLeg, bodyY + 13, 5, 8, palette.outline);
  p.rect(bodyX + 2 + leftLeg, bodyY + 14, 3, 5, palette.navyDark);
  p.rect(bodyX + leftLeg, bodyY + 19, 6, 3, palette.outline);
  p.rect(bodyX + 1 + leftLeg, bodyY + 19, 5, 2, palette.leather);
  p.rect(bodyX + 7 + rightLeg, bodyY + 13, 5, 8, palette.outline);
  p.rect(bodyX + 8 + rightLeg, bodyY + 14, 3, 5, palette.navyDark);
  p.rect(bodyX + 7 + rightLeg, bodyY + 19, 6, 3, palette.outline);
  p.rect(bodyX + 8 + rightLeg, bodyY + 19, 5, 2, palette.leather);

  p.rect(bodyX, bodyY + 6, 13, 10, palette.outline);
  p.rect(bodyX + 1, bodyY + 7, 11, 8, palette.navy);
  p.rect(bodyX + 2, bodyY + 7, 9, 2, palette.navyLight);
  p.rect(bodyX, bodyY + 13, 13, 3, palette.leatherDark);
  p.rect(bodyX + 1, bodyY + 13, 11, 2, palette.leather);
  p.rect(bodyX + 6, bodyY + 13, 2, 2, palette.leatherLight);

  const armSwing = state === "run" ? -runSwing : state === "jump" ? -2 : state === "fall" ? 2 : 0;
  p.rect(bodyX - 4 + armSwing, bodyY + 7, 5, 4, palette.outline);
  p.rect(bodyX - 3 + armSwing, bodyY + 8, 3, 2, palette.leather);
  p.rect(bodyX + 11 - armSwing, bodyY + 7, 5, 4, palette.outline);
  p.rect(bodyX + 12 - armSwing, bodyY + 8, 3, 2, palette.skin);
  p.rect(bodyX - 2, bodyY + 4, 5, 5, palette.outline);
  p.rect(bodyX - 1, bodyY + 5, 3, 3, palette.steel);
  p.rect(bodyX, bodyY + 5, 2, 1, palette.steelLight);

  p.rect(bodyX + 2, bodyY - 2, 10, 9, palette.outline);
  p.rect(bodyX + 3, bodyY - 1, 8, 7, palette.skin);
  p.rect(bodyX + 4, bodyY, 6, 2, palette.skinLight);
  p.rect(bodyX + 9, bodyY + 2, 1, 2, palette.outline);
  drawHair(p, variant, bodyX + 3, bodyY - 3);
  if (state === "damage") {
    p.rect(bodyX + 13, bodyY + 1, 2, 2, palette.damage);
    p.rect(bodyX + 16, bodyY - 1, 1, 3, palette.damage);
  }
  drawSword(p, bodyX, bodyY, state, phase);
}

function drawDeath(p, variant, phase) {
  if (phase < 2) return drawStandingCharacter(p, variant, "damage", phase);
  const x = 5 + Math.min(phase - 2, 2);
  const y = 20 + Math.min(phase - 2, 1);
  p.rect(x, y, 23, 7, palette.outline);
  p.rect(x + 4, y + 1, 13, 5, palette.navy);
  p.rect(x + 1, y + 2, 5, 4, palette.leather);
  p.rect(x + 17, y - 2, 8, 7, palette.outline);
  p.rect(x + 18, y - 1, 6, 5, palette.skin);
  drawHair(p, variant, x + 18, y - 4);
  p.line(x + 23, y + 5, x + 30, y + 6, 2, palette.steelLight);
}

function drawFrame(frameIndex, variant, state, phase) {
  const painter = createPainter(frameIndex);
  if (state === "death") drawDeath(painter, variant, phase);
  else drawStandingCharacter(painter, variant, state, phase);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng() {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    const target = y * (WIDTH * 4 + 1);
    scanlines[target] = 0;
    Buffer.from(pixels.buffer, y * WIDTH * 4, WIDTH * 4).copy(scanlines, target + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const metadata = { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE, imageWidth: WIDTH, imageHeight: HEIGHT, variants: {} };
for (let variantIndex = 0; variantIndex < VARIANTS.length; variantIndex++) {
  const variant = VARIANTS[variantIndex];
  let localFrame = 0;
  const animations = {};
  for (const [state, frameCount, fps, loop] of STATES) {
    const frames = [];
    for (let phase = 0; phase < frameCount; phase++) {
      const frameIndex = variantIndex * ROWS_PER_VARIANT * COLUMNS + localFrame++;
      drawFrame(frameIndex, variant, state, phase);
      frames.push({ x: (frameIndex % COLUMNS) * FRAME_SIZE, y: Math.floor(frameIndex / COLUMNS) * FRAME_SIZE, w: FRAME_SIZE, h: FRAME_SIZE });
    }
    animations[state] = { fps, loop, frames };
  }
  metadata.variants[variant] = animations;
}

await mkdir("assets/player", { recursive: true });
await mkdir("assets/animation", { recursive: true });
await writeFile("assets/player/player-atlas.png", encodePng());
await writeFile("assets/animation/player-atlas.json", `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Generated ${WIDTH}x${HEIGHT} player atlas with ${FRAMES_PER_VARIANT * VARIANTS.length} frames.`);
