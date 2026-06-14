export type AssetDefinition =
  | { id: string; type: "image"; url: string }
  | { id: string; type: "json"; url: string };

export type AssetManifest = readonly AssetDefinition[];

export class AssetLoader {
  private readonly assets = new Map<string, HTMLImageElement | unknown>();
  progress = 0;

  async loadAll(manifest: AssetManifest, onProgress?: (progress: number) => void): Promise<void> {
    this.progress = manifest.length === 0 ? 1 : 0;
    onProgress?.(this.progress);
    let loaded = 0;
    await Promise.all(manifest.map(async (asset) => {
      await this.load(asset);
      loaded++;
      this.progress = loaded / manifest.length;
      onProgress?.(this.progress);
    }));
  }

  get<T>(id: string): T {
    if (!this.assets.has(id)) throw new Error(`Asset not loaded: ${id}`);
    return this.assets.get(id) as T;
  }

  has(id: string): boolean {
    return this.assets.has(id);
  }

  clear(): void {
    this.assets.clear();
    this.progress = 0;
  }

  private async load(asset: AssetDefinition): Promise<void> {
    if (this.assets.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);

    if (asset.type === "json") {
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error(`Failed to load ${asset.url}: ${response.status}`);
      this.assets.set(asset.id, await response.json());
      return;
    }

    const image = new Image();
    image.decoding = "async";
    image.src = asset.url;
    await image.decode();
    this.assets.set(asset.id, image);
  }
}
