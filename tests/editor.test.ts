import { beforeEach, describe, expect, it, vi } from "vitest";
import { ASSET_CATEGORIES, EDITOR_ASSETS } from "../src/editor/assets/AssetCatalog";
import { EditorHistory } from "../src/editor/library/EditorHistory";
import { EditorStorage } from "../src/editor/library/EditorStorage";
import { editorMapToArea, validateEditorMap } from "../src/editor/maps/EditorMap";
import { areaToEditorMap, validatePrototypeArea } from "../src/editor/maps/map1Document";
import type { InputSystem } from "../src/game/input/InputSystem";
import { createMap1 } from "../src/game/maps/map1";
import { SaveManager } from "../src/game/save/SaveManager";
import { GameStateManager } from "../src/game/state/GameStateManager";
import { PrototypeGameplaySystem } from "../src/game/systems/PrototypeGameplaySystem";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
});

describe("developer content toolkit data", () => {
  it("round-trips the production map through the editor document", () => {
    const source = createMap1();
    const document = areaToEditorMap(source);
    const area = editorMapToArea(document);

    expect(document.layers).toHaveLength(8);
    expect(area.platforms).toHaveLength(source.platforms.length);
    expect(area.enemies).toHaveLength(source.enemies.length);
    expect(area.hazards).toHaveLength(source.hazards.length);
    expect(area.spikes).toHaveLength(source.spikes.length);
    expect(area.gold).toHaveLength(source.gold.length);
    expect(area.spawn).toEqual(source.spawn);
    expect(area.goal).toEqual(source.goal);
  });

  it("validates imported documents and rejects malformed objects", () => {
    const document = areaToEditorMap(createMap1());
    expect(validateEditorMap(document).id).toBe(document.id);
    const malformed = structuredClone(document);
    malformed.objects[0]!.x = Number.NaN;
    expect(() => validateEditorMap(malformed)).toThrow(/Invalid transform/);
  });

  it("accepts complete engine-native maps and rejects incomplete imports", () => {
    const map = createMap1();
    expect(validatePrototypeArea(map).platforms.length).toBe(map.platforms.length);
    expect(() => validatePrototypeArea({ id: "broken", name: "Broken", width: 100, height: 100 })).toThrow(/incomplete/);
  });

  it("supports bounded undo and redo snapshots", () => {
    const history = new EditorHistory(3);
    const document = areaToEditorMap(createMap1());
    history.capture(document);
    const changed = structuredClone(document);
    changed.name = "CHANGED";
    expect(history.undo(changed)?.name).toBe(document.name);
    expect(history.redo(document)?.name).toBe("CHANGED");
  });

  it("persists drafts, publishes revisions, restores, and exports JSON", () => {
    const editorStorage = new EditorStorage();
    const document = areaToEditorMap(createMap1());
    editorStorage.saveDraft(document);
    expect(editorStorage.loadDraft()?.id).toBe(document.id);
    const published = editorStorage.publish(document, "Map 1 approved");
    const revision = editorStorage.revisions()[0]!;
    expect(published.status).toBe("published");
    expect(revision.label).toBe("Map 1 approved");
    expect(editorStorage.restore(revision.id)?.objects.length).toBe(document.objects.length);
    expect(editorStorage.import(editorStorage.export(document)).id).toBe(document.id);
  });

  it("indexes every requested asset category", () => {
    for (const category of ASSET_CATEGORIES) {
      expect(EDITOR_ASSETS.some((asset) => asset.category === category), category).toBe(true);
    }
  });
});

describe("editor play-test isolation", () => {
  it("does not write damage or test-map state into the production save", () => {
    const input = { actionDown: () => false, consumeAction: () => false } as unknown as InputSystem;
    const saves = new SaveManager(1);
    saves.load();
    saves.saveRun({ lives: 2, gold: 35, collectedGoldIds: ["m1-gold-01"] });
    const state = new GameStateManager({
      mode: "menu", currentLevel: 0, deaths: 0, message: "", levelCleared: false,
      selectedCharacter: "male", lives: 2, gold: 35, runFlow: "spawn",
    });
    const gameplay = new PrototypeGameplaySystem(input, state, saves, 960);
    const testArea = editorMapToArea(areaToEditorMap(createMap1()));

    gameplay.beginEditorPlaytest(testArea);
    expect(gameplay.isEditorPlaytest).toBe(true);
    gameplay.applyDamage("EDITOR TEST");
    expect(saves.snapshot.run).toEqual({ lives: 2, gold: 35, collectedGoldIds: ["m1-gold-01"] });

    gameplay.endEditorPlaytest();
    expect(gameplay.isEditorPlaytest).toBe(false);
    expect(gameplay.lives.lives).toBe(2);
    expect(gameplay.gold.gold).toBe(35);
  });
});
