import { findAsset } from "./assets/AssetCatalog";
import type { EditorMapDocument, EditorObject } from "./maps/EditorMap";

export interface EditorOverlays {
  collision: boolean;
  checkpoints: boolean;
  spawns: boolean;
  hitboxes: boolean;
}

export class EditorCanvasView {
  readonly selected = new Set<string>();
  zoom = 0.5;
  panX = 40;
  panY = 60;
  showGrid = true;
  snap = true;
  overlays: EditorOverlays = { collision: false, checkpoints: false, spawns: false, hitboxes: false };
  private resizeObserver: ResizeObserver;

  constructor(readonly canvas: HTMLCanvasElement, private document: EditorMapDocument) {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  setDocument(document: EditorMapDocument): void {
    this.document = document;
    this.selected.clear();
    this.fit();
  }

  getDocument(): EditorMapDocument { return this.document; }

  resize(): void {
    const bounds = this.canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.draw();
  }

  fit(): void {
    const bounds = this.canvas.getBoundingClientRect();
    this.zoom = Math.max(0.08, Math.min(1, (bounds.width - 80) / this.document.width));
    this.panX = 40;
    this.panY = Math.max(30, (bounds.height - this.document.height * this.zoom) / 2);
    this.draw();
  }

  setZoom(next: number, anchorX = this.canvas.clientWidth / 2, anchorY = this.canvas.clientHeight / 2): void {
    const world = this.screenToWorld(anchorX, anchorY);
    this.zoom = Math.max(0.08, Math.min(4, next));
    this.panX = anchorX - world.x * this.zoom;
    this.panY = anchorY - world.y * this.zoom;
    this.draw();
  }

  pan(dx: number, dy: number): void {
    this.panX += dx;
    this.panY += dy;
    this.draw();
  }

  screenToWorld(x: number, y: number): { x: number; y: number } {
    return { x: (x - this.panX) / this.zoom, y: (y - this.panY) / this.zoom };
  }

  snapPoint(value: number): number {
    return this.snap ? Math.round(value / this.document.gridSize) * this.document.gridSize : Math.round(value);
  }

  hitTest(x: number, y: number): EditorObject | undefined {
    for (let layerIndex = this.document.layers.length - 1; layerIndex >= 0; layerIndex -= 1) {
      const layer = this.document.layers[layerIndex]!;
      if (!layer.visible || layer.locked) continue;
      for (let objectIndex = this.document.objects.length - 1; objectIndex >= 0; objectIndex -= 1) {
        const object = this.document.objects[objectIndex]!;
        if (object.layer !== layer.id) continue;
        const width = object.width * object.scale;
        const height = object.height * object.scale;
        if (x >= object.x && x <= object.x + width && y >= object.y && y <= object.y + height) return object;
      }
    }
    return undefined;
  }

  draw(): void {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    const ratio = this.canvas.width / Math.max(1, this.canvas.clientWidth);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    ctx.fillStyle = "#0a1017";
    ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);
    this.drawWorld(ctx);
    ctx.restore();
  }

  dispose(): void { this.resizeObserver.disconnect(); }

  private drawWorld(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#102c38";
    ctx.fillRect(0, 0, this.document.width, this.document.height);
    ctx.strokeStyle = "#5b758333";
    ctx.lineWidth = 1 / this.zoom;
    ctx.strokeRect(0, 0, this.document.width, this.document.height);
    if (this.showGrid) this.drawGrid(ctx);
    for (const layer of this.document.layers) {
      if (!layer.visible) continue;
      for (const object of this.document.objects) {
        if (object.layer === layer.id) this.drawObject(ctx, object);
      }
    }
    ctx.strokeStyle = "#e3534f";
    ctx.setLineDash([10 / this.zoom, 6 / this.zoom]);
    ctx.beginPath();
    ctx.moveTo(0, this.document.voidY);
    ctx.lineTo(this.document.width, this.document.voidY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const step = this.document.gridSize;
    ctx.beginPath();
    for (let x = 0; x <= this.document.width; x += step) {
      ctx.moveTo(x, 0); ctx.lineTo(x, this.document.height);
    }
    for (let y = 0; y <= this.document.height; y += step) {
      ctx.moveTo(0, y); ctx.lineTo(this.document.width, y);
    }
    ctx.strokeStyle = "#8bb6c00e";
    ctx.lineWidth = 1 / this.zoom;
    ctx.stroke();
  }

  private drawObject(ctx: CanvasRenderingContext2D, object: EditorObject): void {
    const asset = findAsset(object.assetId);
    const width = object.width * object.scale;
    const height = object.height * object.scale;
    ctx.save();
    ctx.translate(object.x + width / 2, object.y + height / 2);
    ctx.rotate(object.rotation * Math.PI / 180);
    ctx.translate(-width / 2, -height / 2);
    ctx.globalAlpha = object.kind === "background" ? 0.32 : 0.92;
    ctx.fillStyle = asset?.color ?? "#556270";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = asset?.accent ?? "#d5d9d0";
    const accentHeight = Math.max(2, Math.min(height * 0.22, 12));
    ctx.fillRect(0, 0, width, accentHeight);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f5f1d9";
    ctx.font = `${Math.max(9, 11 / this.zoom)}px ui-monospace, monospace`;
    ctx.fillText(asset?.name.slice(0, 18) ?? object.assetId, 4, Math.min(height - 4, accentHeight + 13 / this.zoom));
    if (object.collision && this.overlays.collision) {
      ctx.strokeStyle = "#5de28b";
      ctx.lineWidth = 2 / this.zoom;
      ctx.strokeRect(0, 0, width, height);
    }
    if (this.selected.has(object.id)) {
      ctx.strokeStyle = "#f5c451";
      ctx.lineWidth = 3 / this.zoom;
      ctx.strokeRect(-3 / this.zoom, -3 / this.zoom, width + 6 / this.zoom, height + 6 / this.zoom);
      const handle = 7 / this.zoom;
      ctx.fillStyle = "#f5c451";
      ctx.fillRect(width - handle / 2, height - handle / 2, handle, handle);
    }
    ctx.restore();
    if ((this.overlays.spawns && object.kind === "spawn") || (this.overlays.checkpoints && object.kind === "checkpoint")) {
      ctx.strokeStyle = object.kind === "spawn" ? "#59c9ff" : "#b9ef78";
      ctx.lineWidth = 2 / this.zoom;
      ctx.beginPath();
      ctx.arc(object.x + width / 2, object.y + height / 2, 28 / this.zoom, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (this.overlays.hitboxes && ["enemy", "falling-egg", "spikes", "goal"].includes(object.kind)) {
      ctx.strokeStyle = "#ff6270";
      ctx.lineWidth = 2 / this.zoom;
      ctx.strokeRect(object.x, object.y, width, height);
    }
  }
}
