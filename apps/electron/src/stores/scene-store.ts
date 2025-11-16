import { create } from "zustand";
// TODO: Replace with Electron-specific storage and utils
// import { useProjectStore } from "./project-store";
// import { useTimelineStore } from "./timeline-store";
// import { generateUUID } from "@/lib/utils";

interface Scene {
  id: string;
  name: string;
  isMain: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SceneStore {
  currentScene: Scene | null;
  scenes: Scene[];
  createScene: ({ name, isMain }: { name: string; isMain: boolean }) => Promise<string>;
  deleteScene: ({ sceneId }: { sceneId: string }) => Promise<void>;
  renameScene: ({ sceneId, name }: { sceneId: string; name: string }) => Promise<void>;
  switchToScene: ({ sceneId }: { sceneId: string }) => Promise<void>;
  getMainScene: () => Scene | null;
  getCurrentScene: () => Scene | null;
  loadProjectScenes: ({ projectId }: { projectId: string }) => Promise<void>;
  initializeScenes: ({
    scenes,
    currentSceneId,
  }: {
    scenes: Scene[];
    currentSceneId?: string;
  }) => void;
  clearScenes: () => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  currentScene: null,
  scenes: [],
  createScene: async ({ name, isMain = false }) => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      name,
      isMain,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ scenes: [...state.scenes, newScene] }));
    // TODO: Save to SQLite
    return newScene.id;
  },
  deleteScene: async ({ sceneId }) => {
    set((state) => ({ scenes: state.scenes.filter((s) => s.id !== sceneId) }));
    // TODO: Remove from SQLite
  },
  renameScene: async ({ sceneId, name }) => {
    set((state) => ({
      scenes: state.scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, name, updatedAt: new Date() } : scene
      ),
    }));
    // TODO: Update in SQLite
  },
  switchToScene: async ({ sceneId }) => {
    const targetScene = get().scenes.find((s) => s.id === sceneId) || null;
    set({ currentScene: targetScene });
    // TODO: Load timeline for scene from SQLite
  },
  getMainScene: () => {
    const { scenes } = get();
    return scenes.find((scene) => scene.isMain) || null;
  },
  getCurrentScene: () => {
    return get().currentScene;
  },
  loadProjectScenes: async ({ projectId }) => {
    // TODO: Load scenes from SQLite
    set({ scenes: [] });
  },
  initializeScenes: ({ scenes, currentSceneId }) => {
    set({
      scenes,
      currentScene: currentSceneId ? scenes.find((s) => s.id === currentSceneId) || null : null,
    });
  },
  clearScenes: () => {
    set({ scenes: [], currentScene: null });
    // TODO: Remove all scenes from SQLite
  },
}));
