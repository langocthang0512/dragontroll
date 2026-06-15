import "./editor.css";
import { ASSET_CATEGORIES, EDITOR_ASSETS, findAsset, type EditorAsset } from "./assets/AssetCatalog";
import { EditorCanvasView } from "./EditorCanvasView";
import { EditorHistory } from "./library/EditorHistory";
import { EditorStorage } from "./library/EditorStorage";
import { cloneEditorMap, editorMapToArea, type EditorMapDocument, type EditorObject } from "./maps/EditorMap";
import { areaToEditorMap, validatePrototypeArea } from "./maps/map1Document";
import type { PrototypeArea } from "../game/gameplay/types";

interface ToolkitCallbacks {
  play: (area: PrototypeArea) => void;
  stopPlay: () => void;
  exit: () => void;
}

type DragState =
  | { mode: "move"; startX: number; startY: number; positions: Map<string, { x: number; y: number }> }
  | { mode: "pan"; startX: number; startY: number; panX: number; panY: number };

const ROW_HEIGHT = 70;

export class DeveloperToolkit {
  private readonly root: HTMLElement;
  private readonly returnButton: HTMLButtonElement;
  private readonly storage = new EditorStorage();
  private readonly history = new EditorHistory();
  private readonly view: EditorCanvasView;
  private document: EditorMapDocument;
  private filteredAssets: readonly EditorAsset[] = EDITOR_ASSETS;
  private favoriteAssets = new Set<string>();
  private clipboard: EditorObject[] = [];
  private activeAssetId = EDITOR_ASSETS[0]!.id;
  private drag?: DragState;
  private dirty = false;
  private playtesting = false;
  private autoSaveTimer = 0;
  private previewFrame = 0;
  private previewTime = 0;
  private fps = 60;
  private frames = 0;
  private fpsTime = performance.now();

  constructor(host: HTMLElement, initialDocument: EditorMapDocument, private readonly callbacks: ToolkitCallbacks) {
    this.document = cloneEditorMap(initialDocument);
    this.root = document.createElement("section");
    this.root.className = "dev-editor is-hidden";
    this.root.setAttribute("aria-label", "Developer content toolkit");
    this.root.innerHTML = this.shell();
    host.appendChild(this.root);
    this.returnButton = document.createElement("button");
    this.returnButton.className = "editor-return is-hidden";
    this.returnButton.textContent = "RETURN TO EDITOR  [CTRL+SHIFT+E]";
    host.appendChild(this.returnButton);
    this.view = new EditorCanvasView(this.query<HTMLCanvasElement>("#editor-scene"), this.document);
    this.bind();
    this.renderAll();
  }

  get isOpen(): boolean { return !this.root.classList.contains("is-hidden"); }
  get isPlaytesting(): boolean { return this.playtesting; }

  open(): void {
    if (this.playtesting) this.stopPlaytest();
    this.root.classList.remove("is-hidden");
    this.root.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => { this.view.resize(); this.renderPreview(); });
  }

  close(): void {
    this.root.classList.add("is-hidden");
    this.root.setAttribute("aria-hidden", "true");
    this.callbacks.exit();
  }

  toggle(): void { this.isOpen ? this.close() : this.open(); }

  dispose(): void {
    clearInterval(this.autoSaveTimer);
    cancelAnimationFrame(this.previewFrame);
    this.view.dispose();
    this.root.remove();
    this.returnButton.remove();
  }

  private shell(): string {
    const categoryOptions = ["All", ...ASSET_CATEGORIES].map((item) => `<option>${item}</option>`).join("");
    return `
      <header class="editor-toolbar">
        <div class="editor-brand"><b>DRAGON TROLL</b><span>CONTENT TOOLKIT</span></div>
        <nav class="editor-actions" aria-label="Map actions">
          <button data-action="new">NEW</button><button data-action="load">LOAD</button><button data-action="save">SAVE</button>
          <button data-action="duplicate-map">DUPLICATE</button><button data-action="import">IMPORT</button><button data-action="export">EXPORT JSON</button><button data-action="export-native">EXPORT NATIVE</button>
          <i></i><button data-action="undo">UNDO</button><button data-action="redo">REDO</button>
          <button class="editor-play" data-action="play">PLAY</button><button data-action="publish">PUBLISH</button><button data-action="close">CLOSE</button>
        </nav>
        <input id="editor-import" type="file" accept="application/json,.json" hidden>
      </header>
      <aside class="editor-panel editor-assets">
        <div class="panel-heading"><b>ASSET BROWSER</b><button data-collapse="assets">-</button></div>
        <div class="asset-controls">
          <input id="asset-search" type="search" placeholder="Search assets">
          <select id="asset-category">${categoryOptions}</select>
          <select id="asset-sort"><option value="category">Category</option><option value="name">Name</option><option value="favorite">Favorites</option></select>
          <label><input id="asset-favorites" type="checkbox"> FAVORITES</label>
        </div>
        <div id="asset-viewport" class="asset-viewport"><div id="asset-list" class="asset-list"></div></div>
      </aside>
      <div class="editor-resizer resize-left" data-resize="left"></div>
      <main class="editor-scene-wrap">
        <div class="scene-toolbar">
          <button data-action="select">SELECT</button><button data-action="copy">COPY</button><button data-action="paste">PASTE</button>
          <button data-action="duplicate">DUPLICATE</button><button data-action="delete">DELETE</button>
          <label><input id="toggle-grid" type="checkbox" checked> GRID</label><label><input id="toggle-snap" type="checkbox" checked> SNAP</label>
          <select id="grid-size"><option>8</option><option selected>16</option><option>32</option><option>64</option></select>
          <button data-action="zoom-out">-</button><span id="zoom-label">50%</span><button data-action="zoom-in">+</button><button data-action="fit">FIT</button>
        </div>
        <canvas id="editor-scene" aria-label="Map scene view"></canvas>
        <div class="scene-help">DRAG ASSETS TO PLACE | SHIFT MULTI-SELECT | MIDDLE/ALT DRAG PAN | CTRL+WHEEL ZOOM</div>
      </main>
      <div class="editor-resizer resize-right" data-resize="right"></div>
      <aside class="editor-panel editor-properties">
        <div class="panel-heading"><b>PROPERTIES</b><button data-collapse="properties">-</button></div>
        <div id="object-properties" class="properties-body"></div>
        <div class="panel-heading layer-heading"><b>LAYERS</b></div>
        <div id="layer-list" class="layer-list"></div>
        <div class="panel-heading layer-heading"><b>VERSION HISTORY</b></div>
        <div id="revision-list" class="revision-list"></div>
      </aside>
      <div class="editor-resizer resize-bottom" data-resize="bottom"></div>
      <section class="editor-preview">
        <div class="panel-heading"><b>ASSET PREVIEW</b><button data-collapse="preview">-</button></div>
        <canvas id="asset-preview" width="300" height="126"></canvas>
        <div id="asset-metadata" class="asset-metadata"></div>
        <div class="qa-tools">
          <b>QA</b>
          <label><input data-overlay="collision" type="checkbox"> COLLISION</label>
          <label><input data-overlay="hitboxes" type="checkbox"> HITBOXES</label>
          <label><input data-overlay="checkpoints" type="checkbox"> CHECKPOINTS</label>
          <label><input data-overlay="spawns" type="checkbox"> SPAWN</label>
          <span id="editor-fps">60 FPS</span><span id="editor-memory">MEMORY N/A</span>
        </div>
      </section>
      <footer class="editor-status"><span id="editor-status">READY</span><span id="object-count"></span><span>AUTOSAVE ON</span></footer>`;
  }

  private bind(): void {
    this.root.addEventListener("click", this.onClick);
    this.root.addEventListener("input", this.onInput);
    this.root.addEventListener("change", this.onChange);
    this.root.addEventListener("keydown", this.onKeyDown);
    this.query("#asset-viewport").addEventListener("scroll", () => this.renderAssetList());
    this.query("#asset-list").addEventListener("dragstart", this.onAssetDragStart);
    const canvas = this.view.canvas;
    canvas.addEventListener("dragover", (event) => event.preventDefault());
    canvas.addEventListener("drop", this.onAssetDrop);
    canvas.addEventListener("pointerdown", this.onScenePointerDown);
    canvas.addEventListener("pointermove", this.onScenePointerMove);
    canvas.addEventListener("pointerup", this.onScenePointerUp);
    canvas.addEventListener("pointercancel", this.onScenePointerUp);
    canvas.addEventListener("wheel", this.onSceneWheel, { passive: false });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    this.returnButton.addEventListener("click", () => this.stopPlaytest());
    this.autoSaveTimer = window.setInterval(() => {
      if (!this.dirty) return;
      this.storage.saveDraft(this.document);
      this.dirty = false;
      this.status("AUTOSAVED");
    }, 2500);
    this.animatePreview(performance.now());
    for (const resizer of this.root.querySelectorAll<HTMLElement>("[data-resize]")) this.bindResizer(resizer);
  }

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action) this.performAction(action);
    const card = target.closest<HTMLElement>("[data-asset-id]");
    if (card) {
      const id = card.dataset.assetId!;
      if (target.closest("[data-favorite]")) {
        this.favoriteAssets.has(id) ? this.favoriteAssets.delete(id) : this.favoriteAssets.add(id);
        this.filterAssets();
      } else {
        this.activeAssetId = id;
        this.renderAssetList();
        this.renderPreview();
      }
    }
    const layerControl = target.closest<HTMLElement>("[data-layer-control]");
    if (layerControl) this.toggleLayer(layerControl.dataset.layerId!, layerControl.dataset.layerControl!);
    const restore = target.closest<HTMLElement>("[data-restore]")?.dataset.restore;
    if (restore) {
      const document = this.storage.restore(restore);
      if (document) this.replaceDocument(document, "REVISION RESTORED");
    }
    const collapse = target.closest<HTMLElement>("[data-collapse]")?.dataset.collapse;
    if (collapse) this.root.classList.toggle(`collapse-${collapse}`);
  };

  private readonly onInput = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (["asset-search", "asset-category", "asset-sort", "asset-favorites"].includes(target.id)) this.filterAssets();
  };

  private readonly onChange = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (target.id === "editor-import" && target instanceof HTMLInputElement) void this.importFile(target);
    if (target.id === "toggle-grid") { this.view.showGrid = (target as HTMLInputElement).checked; this.view.draw(); }
    if (target.id === "toggle-snap") this.view.snap = (target as HTMLInputElement).checked;
    if (target.id === "grid-size") { this.capture(); this.document.gridSize = Number(target.value); this.changed(); }
    const overlay = target.dataset.overlay as keyof typeof this.view.overlays | undefined;
    if (overlay) { this.view.overlays[overlay] = (target as HTMLInputElement).checked; this.view.draw(); }
    const property = target.dataset.property as keyof EditorObject | undefined;
    if (property) this.updateProperty(property, target);
    if (target.dataset.metadata !== undefined) this.updateMetadata(target as HTMLTextAreaElement);
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement;
    if (typing && event.key !== "Escape") return;
    if (event.ctrlKey && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? this.redo() : this.undo(); }
    if (event.ctrlKey && event.key.toLowerCase() === "y") { event.preventDefault(); this.redo(); }
    if (event.ctrlKey && event.key.toLowerCase() === "c") { event.preventDefault(); this.copy(); }
    if (event.ctrlKey && event.key.toLowerCase() === "v") { event.preventDefault(); this.paste(); }
    if (event.ctrlKey && event.key.toLowerCase() === "d") { event.preventDefault(); this.duplicateSelection(); }
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); this.deleteSelection(); }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const distance = event.shiftKey ? this.document.gridSize : 1;
      this.moveSelection(event.key === "ArrowLeft" ? -distance : event.key === "ArrowRight" ? distance : 0, event.key === "ArrowUp" ? -distance : event.key === "ArrowDown" ? distance : 0);
    }
  };

  private readonly onAssetDragStart = (event: DragEvent): void => {
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-asset-id]");
    if (card?.dataset.assetId) event.dataTransfer?.setData("application/x-editor-asset", card.dataset.assetId);
  };

  private readonly onAssetDrop = (event: DragEvent): void => {
    event.preventDefault();
    const id = event.dataTransfer?.getData("application/x-editor-asset");
    const asset = id ? findAsset(id) : undefined;
    if (!asset) return;
    const bounds = this.view.canvas.getBoundingClientRect();
    const point = this.view.screenToWorld(event.clientX - bounds.left, event.clientY - bounds.top);
    this.capture();
    const object: EditorObject = {
      id: `${asset.id}-${crypto.randomUUID().slice(0, 8)}`,
      assetId: asset.id, kind: asset.kind, layer: asset.layer,
      x: this.view.snapPoint(point.x - asset.width / 2), y: this.view.snapPoint(point.y - asset.height / 2),
      width: asset.width, height: asset.height, scale: 1, rotation: 0,
      animation: asset.animation, collision: asset.collision, behavior: this.defaultBehavior(asset), difficulty: 1, metadata: {},
    };
    this.document.objects.push(object);
    this.view.selected.clear(); this.view.selected.add(object.id);
    this.activeAssetId = asset.id;
    this.changed("ASSET PLACED");
  };

  private readonly onScenePointerDown = (event: PointerEvent): void => {
    const bounds = this.view.canvas.getBoundingClientRect();
    const screenX = event.clientX - bounds.left;
    const screenY = event.clientY - bounds.top;
    if (event.button === 1 || event.button === 2 || event.altKey) {
      this.drag = { mode: "pan", startX: event.clientX, startY: event.clientY, panX: this.view.panX, panY: this.view.panY };
    } else {
      const point = this.view.screenToWorld(screenX, screenY);
      const hit = this.view.hitTest(point.x, point.y);
      if (!hit) {
        if (!event.shiftKey) this.view.selected.clear();
        this.renderProperties(); this.view.draw();
        return;
      }
      if (event.shiftKey) this.view.selected.has(hit.id) ? this.view.selected.delete(hit.id) : this.view.selected.add(hit.id);
      else if (!this.view.selected.has(hit.id)) { this.view.selected.clear(); this.view.selected.add(hit.id); }
      const positions = new Map<string, { x: number; y: number }>();
      for (const object of this.selectedObjects()) positions.set(object.id, { x: object.x, y: object.y });
      this.capture();
      this.drag = { mode: "move", startX: point.x, startY: point.y, positions };
      this.activeAssetId = hit.assetId;
      this.renderProperties(); this.renderPreview(); this.view.draw();
    }
    this.view.canvas.setPointerCapture(event.pointerId);
  };

  private readonly onScenePointerMove = (event: PointerEvent): void => {
    if (!this.drag) return;
    if (this.drag.mode === "pan") {
      this.view.panX = this.drag.panX + event.clientX - this.drag.startX;
      this.view.panY = this.drag.panY + event.clientY - this.drag.startY;
      this.view.draw();
      return;
    }
    const bounds = this.view.canvas.getBoundingClientRect();
    const point = this.view.screenToWorld(event.clientX - bounds.left, event.clientY - bounds.top);
    const dx = point.x - this.drag.startX;
    const dy = point.y - this.drag.startY;
    for (const object of this.selectedObjects()) {
      const start = this.drag.positions.get(object.id)!;
      object.x = this.view.snapPoint(start.x + dx);
      object.y = this.view.snapPoint(start.y + dy);
    }
    this.view.draw();
  };

  private readonly onScenePointerUp = (event: PointerEvent): void => {
    if (this.drag?.mode === "move") this.changed("OBJECT MOVED");
    this.drag = undefined;
    if (this.view.canvas.hasPointerCapture(event.pointerId)) this.view.canvas.releasePointerCapture(event.pointerId);
  };

  private readonly onSceneWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (event.ctrlKey) this.view.setZoom(this.view.zoom * (event.deltaY > 0 ? 0.88 : 1.12), event.offsetX, event.offsetY);
    else this.view.pan(-event.deltaX, -event.deltaY);
    this.updateZoomLabel();
  };

  private performAction(action: string): void {
    if (action === "close") this.close();
    if (action === "new") this.newMap();
    if (action === "save") { this.storage.saveDraft(this.document); this.dirty = false; this.status("DRAFT SAVED"); }
    if (action === "load") { const draft = this.storage.loadDraft(); draft ? this.replaceDocument(draft, "DRAFT LOADED") : this.status("NO DRAFT FOUND"); }
    if (action === "duplicate-map") this.replaceDocument(this.storage.duplicate(this.document), "MAP DUPLICATED");
    if (action === "export") this.exportMap();
    if (action === "export-native") this.exportNativeMap();
    if (action === "import") this.query<HTMLInputElement>("#editor-import").click();
    if (action === "publish") this.publish();
    if (action === "undo") this.undo();
    if (action === "redo") this.redo();
    if (action === "copy") this.copy();
    if (action === "paste") this.paste();
    if (action === "duplicate") this.duplicateSelection();
    if (action === "delete") this.deleteSelection();
    if (action === "zoom-in") { this.view.setZoom(this.view.zoom * 1.25); this.updateZoomLabel(); }
    if (action === "zoom-out") { this.view.setZoom(this.view.zoom / 1.25); this.updateZoomLabel(); }
    if (action === "fit") { this.view.fit(); this.updateZoomLabel(); }
    if (action === "play") this.startPlaytest();
  }

  private filterAssets(): void {
    const search = this.query<HTMLInputElement>("#asset-search").value.trim().toLowerCase();
    const category = this.query<HTMLSelectElement>("#asset-category").value;
    const favoritesOnly = this.query<HTMLInputElement>("#asset-favorites").checked;
    const sort = this.query<HTMLSelectElement>("#asset-sort").value;
    const results = EDITOR_ASSETS.filter((asset) =>
      (category === "All" || asset.category === category) &&
      (!favoritesOnly || this.favoriteAssets.has(asset.id)) &&
      (!search || `${asset.name} ${asset.category} ${asset.tags.join(" ")}`.toLowerCase().includes(search)),
    );
    results.sort((a, b) => sort === "favorite" ? Number(this.favoriteAssets.has(b.id)) - Number(this.favoriteAssets.has(a.id)) || a.name.localeCompare(b.name) : sort === "name" ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    this.filteredAssets = results;
    this.query("#asset-viewport").scrollTop = 0;
    this.renderAssetList();
  }

  private renderAssetList(): void {
    const viewport = this.query("#asset-viewport");
    const list = this.query("#asset-list");
    const start = Math.max(0, Math.floor(viewport.scrollTop / ROW_HEIGHT) - 2);
    const count = Math.ceil(viewport.clientHeight / ROW_HEIGHT) + 5;
    const visible = this.filteredAssets.slice(start, start + count);
    list.style.height = `${this.filteredAssets.length * ROW_HEIGHT}px`;
    list.innerHTML = visible.map((asset, index) => `
      <article class="asset-card ${asset.id === this.activeAssetId ? "active" : ""}" data-asset-id="${asset.id}" draggable="true" style="top:${(start + index) * ROW_HEIGHT}px">
        <span class="asset-thumb" style="--asset:${asset.color};--accent:${asset.accent}"><i></i></span>
        <span><b>${asset.name}</b><small>${asset.category} | ${asset.width}x${asset.height}</small></span>
        <button data-favorite="true" title="Favorite">${this.favoriteAssets.has(asset.id) ? "FAV" : "+"}</button>
      </article>`).join("");
  }

  private renderProperties(): void {
    const panel = this.query("#object-properties");
    const selected = this.selectedObjects();
    if (selected.length !== 1) {
      panel.innerHTML = selected.length ? `<p>${selected.length} OBJECTS SELECTED</p><button data-action="duplicate">DUPLICATE</button><button data-action="delete">DELETE</button>` : `<p>SELECT AN OBJECT</p><small>Drag assets from the browser into the scene.</small>`;
      return;
    }
    const object = selected[0]!;
    panel.innerHTML = `
      <label>ID<input value="${this.escape(object.id)}" disabled></label>
      <label>ASSET<input value="${this.escape(object.assetId)}" disabled></label>
      <div class="property-pair"><label>X<input type="number" data-property="x" value="${object.x}"></label><label>Y<input type="number" data-property="y" value="${object.y}"></label></div>
      <div class="property-pair"><label>WIDTH<input type="number" data-property="width" value="${object.width}"></label><label>HEIGHT<input type="number" data-property="height" value="${object.height}"></label></div>
      <div class="property-pair"><label>SCALE<input type="number" min="0.1" step="0.1" data-property="scale" value="${object.scale}"></label><label>ROTATION<input type="number" step="15" data-property="rotation" value="${object.rotation}"></label></div>
      <label>ANIMATION<input data-property="animation" value="${this.escape(object.animation)}"></label>
      <label>BEHAVIOR<input data-property="behavior" value="${this.escape(object.behavior)}"></label>
      <label>DIFFICULTY<input type="number" min="1" max="5" data-property="difficulty" value="${object.difficulty}"></label>
      <label class="property-check"><input type="checkbox" data-property="collision" ${object.collision ? "checked" : ""}> COLLISION</label>
      <label>METADATA JSON<textarea data-metadata>${this.escape(JSON.stringify(object.metadata, null, 2))}</textarea></label>`;
  }

  private renderLayers(): void {
    this.query("#layer-list").innerHTML = this.document.layers.map((layer) => `
      <div class="layer-row"><span>${layer.label}</span>
        <button data-layer-control="visible" data-layer-id="${layer.id}">${layer.visible ? "VISIBLE" : "HIDDEN"}</button>
        <button data-layer-control="locked" data-layer-id="${layer.id}">${layer.locked ? "LOCKED" : "EDIT"}</button>
        <small>${this.document.objects.filter((object) => object.layer === layer.id).length}</small>
      </div>`).join("");
  }

  private renderRevisions(): void {
    const revisions = this.storage.revisions();
    this.query("#revision-list").innerHTML = revisions.length ? revisions.map((revision) => `<div><span><b>${this.escape(revision.label)}</b><small>${new Date(revision.createdAt).toLocaleString()}</small></span><button data-restore="${revision.id}">RESTORE</button></div>`).join("") : "<small>NO PUBLISHED REVISIONS</small>";
  }

  private renderPreview(): void {
    const asset = findAsset(this.activeAssetId) ?? EDITOR_ASSETS[0]!;
    const canvas = this.query<HTMLCanvasElement>("#asset-preview");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#09121a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#274456"; ctx.strokeRect(8.5, 8.5, 283, 109);
    const pulse = 1 + Math.sin(this.previewTime * 4) * (asset.animation === "none" ? 0 : 0.04);
    const scale = Math.min(3.4, 88 / Math.max(asset.width, asset.height)) * pulse;
    const width = asset.width * scale; const height = asset.height * scale;
    const x = 150 - width / 2; const y = 63 - height / 2;
    ctx.fillStyle = asset.color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    ctx.fillStyle = asset.accent; ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.max(4, Math.round(height * 0.2)));
    ctx.fillStyle = "#f4e8c1"; ctx.font = "10px ui-monospace"; ctx.fillText(asset.animation.toUpperCase(), 14, 108);
    const usage = this.document.objects.filter((object) => object.assetId === asset.id).length;
    this.query("#asset-metadata").innerHTML = `<b>${asset.name}</b><span>${asset.description}</span><span>ANIMATION ${asset.animation}</span><span>SCALE 1:1 | COLLISION ${asset.collision ? "YES" : "NO"}</span><span>TAGS ${asset.tags.join(", ")}</span><span>USAGE ${usage}</span>`;
  }

  private animatePreview = (timestamp: number): void => {
    this.previewFrame = requestAnimationFrame(this.animatePreview);
    if (!this.isOpen) return;
    this.previewTime = timestamp / 1000;
    this.frames += 1;
    if (timestamp - this.fpsTime >= 500) {
      this.fps = Math.round(this.frames * 1000 / (timestamp - this.fpsTime));
      this.frames = 0; this.fpsTime = timestamp;
      this.query("#editor-fps").textContent = `${this.fps} FPS`;
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      this.query("#editor-memory").textContent = memory ? `${Math.round(memory.usedJSHeapSize / 1048576)} MB` : "MEMORY N/A";
    }
    this.renderPreview();
  };

  private renderAll(): void {
    this.filterAssets(); this.renderProperties(); this.renderLayers(); this.renderRevisions(); this.renderPreview(); this.view.draw(); this.updateStatusCounts();
  }

  private updateProperty(property: keyof EditorObject, target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void {
    const object = this.selectedObjects()[0];
    if (!object) return;
    this.capture();
    if (property === "collision") object.collision = (target as HTMLInputElement).checked;
    else if (["x", "y", "width", "height", "scale", "rotation", "difficulty"].includes(property)) (object as unknown as Record<string, number>)[property] = Number(target.value);
    else (object as unknown as Record<string, string>)[property] = target.value;
    this.changed("PROPERTY UPDATED");
  }

  private updateMetadata(target: HTMLTextAreaElement): void {
    const object = this.selectedObjects()[0];
    if (!object) return;
    try {
      const value = JSON.parse(target.value) as Record<string, string | number | boolean>;
      this.capture(); object.metadata = value; target.classList.remove("invalid"); this.changed("METADATA UPDATED");
    } catch { target.classList.add("invalid"); this.status("INVALID METADATA JSON"); }
  }

  private toggleLayer(id: string, control: string): void {
    const layer = this.document.layers.find((item) => item.id === id);
    if (!layer) return;
    this.capture();
    if (control === "visible") layer.visible = !layer.visible;
    if (control === "locked") layer.locked = !layer.locked;
    this.changed("LAYER UPDATED");
  }

  private newMap(): void {
    const base = cloneEditorMap(this.document);
    base.id = `map-${Date.now()}`; base.name = "UNTITLED MAP"; base.status = "draft"; base.revision = 1;
    base.objects = base.objects.filter((object) => object.kind === "spawn" || object.kind === "goal" || object.kind === "background");
    this.replaceDocument(base, "NEW MAP CREATED");
  }

  private startPlaytest(): void {
    this.storage.saveDraft(this.document);
    this.playtesting = true;
    this.root.classList.add("is-hidden");
    this.returnButton.classList.remove("is-hidden");
    this.callbacks.play(editorMapToArea(this.document));
  }

  private stopPlaytest(): void {
    if (!this.playtesting) return;
    this.playtesting = false;
    this.callbacks.stopPlay();
    this.returnButton.classList.add("is-hidden");
    this.open();
  }

  private publish(): void {
    this.document = this.storage.publish(this.document, `${this.document.name} r${this.document.revision + 1}`);
    this.view.setDocument(this.document);
    this.dirty = false;
    this.renderAll(); this.status("PUBLISHED");
  }

  private exportMap(): void {
    this.download(this.storage.export(this.document), `${this.document.id}.json`);
    this.status("JSON EXPORTED");
  }

  private exportNativeMap(): void {
    this.download(JSON.stringify(editorMapToArea(this.document), null, 2), `${this.document.id}.native.json`);
    this.status("NATIVE MAP EXPORTED");
  }

  private async importFile(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      const value = JSON.parse(raw) as unknown;
      const document = value && typeof value === "object" && "schemaVersion" in value
        ? this.storage.import(raw)
        : areaToEditorMap(validatePrototypeArea(value));
      this.replaceDocument(document, "MAP IMPORTED");
    }
    catch (error) { this.status(error instanceof Error ? error.message.toUpperCase() : "IMPORT FAILED"); }
    input.value = "";
  }

  private copy(): void { this.clipboard = this.selectedObjects().map((object) => structuredClone(object)); this.status(`${this.clipboard.length} OBJECTS COPIED`); }
  private paste(): void {
    if (!this.clipboard.length) return;
    this.capture(); this.view.selected.clear();
    for (const source of this.clipboard) {
      const object = { ...structuredClone(source), id: `${source.assetId}-${crypto.randomUUID().slice(0, 8)}`, x: source.x + this.document.gridSize, y: source.y + this.document.gridSize };
      this.document.objects.push(object); this.view.selected.add(object.id);
    }
    this.changed("OBJECTS PASTED");
  }
  private duplicateSelection(): void { this.copy(); this.paste(); }
  private deleteSelection(): void {
    if (!this.view.selected.size) return;
    this.capture(); this.document.objects = this.document.objects.filter((object) => !this.view.selected.has(object.id)); this.view.selected.clear(); this.changed("OBJECTS DELETED");
  }
  private moveSelection(dx: number, dy: number): void {
    if (!this.view.selected.size) return;
    this.capture(); for (const object of this.selectedObjects()) { object.x += dx; object.y += dy; } this.changed("OBJECTS MOVED");
  }

  private undo(): void { const previous = this.history.undo(this.document); if (previous) this.replaceDocument(previous, "UNDO", false); }
  private redo(): void { const next = this.history.redo(this.document); if (next) this.replaceDocument(next, "REDO", false); }
  private capture(): void { this.history.capture(this.document); }
  private changed(message = "MAP UPDATED"): void { this.document.updatedAt = new Date().toISOString(); this.dirty = true; this.renderProperties(); this.renderLayers(); this.renderPreview(); this.view.draw(); this.updateStatusCounts(); this.status(message); }
  private replaceDocument(document: EditorMapDocument, message: string, capture = true): void {
    if (capture) this.capture();
    this.document = cloneEditorMap(document); this.view.setDocument(this.document); this.dirty = true; this.renderAll(); this.status(message);
  }
  private selectedObjects(): EditorObject[] { return this.document.objects.filter((object) => this.view.selected.has(object.id)); }

  private defaultBehavior(asset: EditorAsset): string {
    if (asset.kind === "enemy") return "patrol-approach";
    if (asset.kind === "gold") return "pickup";
    if (asset.kind === "checkpoint") return "checkpoint";
    if (asset.kind === "falling-egg") return "falling-telegraph";
    if (asset.kind === "spikes") return "touch-damage";
    return asset.collision ? "static" : "decorative";
  }

  private download(content: string, filename: string): void {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; anchor.click();
    URL.revokeObjectURL(url);
  }

  private bindResizer(resizer: HTMLElement): void {
    resizer.addEventListener("pointerdown", (event) => {
      const kind = resizer.dataset.resize!;
      const startX = event.clientX; const startY = event.clientY;
      const style = getComputedStyle(this.root);
      const left = parseFloat(style.getPropertyValue("--assets-width"));
      const right = parseFloat(style.getPropertyValue("--properties-width"));
      const bottom = parseFloat(style.getPropertyValue("--preview-height"));
      const move = (next: PointerEvent): void => {
        if (kind === "left") this.root.style.setProperty("--assets-width", `${Math.max(190, Math.min(480, left + next.clientX - startX))}px`);
        if (kind === "right") this.root.style.setProperty("--properties-width", `${Math.max(220, Math.min(520, right - next.clientX + startX))}px`);
        if (kind === "bottom") this.root.style.setProperty("--preview-height", `${Math.max(100, Math.min(330, bottom - next.clientY + startY))}px`);
        this.view.resize();
      };
      const up = (): void => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    });
  }

  private updateZoomLabel(): void { this.query("#zoom-label").textContent = `${Math.round(this.view.zoom * 100)}%`; }
  private updateStatusCounts(): void { this.query("#object-count").textContent = `${this.document.objects.length} OBJECTS | ${this.document.width}x${this.document.height}`; }
  private status(message: string): void { this.query("#editor-status").textContent = message; }
  private query<T extends HTMLElement = HTMLElement>(selector: string): T { const element = this.root.querySelector<T>(selector); if (!element) throw new Error(`Editor element not found: ${selector}`); return element; }
  private escape(value: string): string { const span = document.createElement("span"); span.textContent = value; return span.innerHTML; }
}
