import { create } from "zustand";
import { trpcClient } from "@/utils/trpc";
import type { TProject } from "@/services/editor-storage";

const randomUUID = () => crypto.randomUUID();

export const DEFAULT_CANVAS_SIZE = { width: 1920, height: 1080 } as const;
export const DEFAULT_FPS = 30;

function createMainScene() {
  return {
    id: randomUUID(),
    name: "Main Scene",
    isMain: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createDefaultProject(name: string): TProject {
  const mainScene = createMainScene();
  return {
    id: randomUUID(),
    name,
    thumbnail: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    scenes: [mainScene],
    currentSceneId: mainScene.id,
    backgroundColor: "#000000",
    backgroundType: "color",
    blurIntensity: 8,
    bookmarks: [],
    fps: DEFAULT_FPS,
    canvasSize: DEFAULT_CANVAS_SIZE,
    canvasMode: "preset",
  };
}

interface ProjectStore {
  activeProject: TProject | null;
  savedProjects: TProject[];
  isLoading: boolean;
  isInitialized: boolean;
  invalidProjectIds: Set<string>;

  loadAllProjects: () => Promise<void>;
  createNewProject: (name: string) => Promise<string>;
  loadProject: (id: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  updateProjectFps: (fps: number) => Promise<void>;
  updateCanvasSize: (size: { width: number; height: number }, mode: string) => Promise<void>;
  updateBackgroundType: (
    type: "color" | "blur",
    opts?: { backgroundColor?: string; blurIntensity?: number }
  ) => Promise<void>;
  toggleBookmark: (time: number) => Promise<void>;
  isBookmarked: (time: number) => boolean;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<string>;
  closeProject: () => void;
  getFilteredAndSortedProjects: (search: string, sort: string) => TProject[];
  isInvalidProjectId: (id: string) => boolean;
  markProjectIdAsInvalid: (id: string) => void;
  clearInvalidProjectIds: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  activeProject: null,
  savedProjects: [],
  isLoading: false,
  isInitialized: false,
  invalidProjectIds: new Set<string>(),

  loadAllProjects: async () => {
    if (!get().isInitialized) set({ isLoading: true });
    try {
      const rawProjects = await trpcClient.editor.projects.list.query();
      const projects: TProject[] = rawProjects.map((p) => ({
        id: p.id,
        name: p.name,
        thumbnail: p.thumbnail ?? "",
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt ?? p.createdAt),
        scenes: [],
        currentSceneId: p.currentSceneId ?? "",
        backgroundColor: p.backgroundColor ?? "#000000",
        backgroundType: (p.backgroundType as "color" | "blur") ?? "color",
        blurIntensity: p.blurIntensity ?? 8,
        bookmarks: p.bookmarksJson ? JSON.parse(p.bookmarksJson) : [],
        fps: p.fps ?? 30,
        canvasSize: {
          width: p.canvasWidth ?? 1920,
          height: p.canvasHeight ?? 1080,
        },
        canvasMode: (p.canvasMode as "preset" | "custom") ?? "preset",
      }));
      set({ savedProjects: projects });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  createNewProject: async (name: string) => {
    const result = await trpcClient.editor.projects.create.mutate({ name });
    await get().loadAllProjects();
    await get().loadProject(result.id);
    return result.id;
  },

  loadProject: async (id: string) => {
    set({ isLoading: true });
    try {
      const data = await trpcClient.editor.projects.get.query({ id });
      if (!data || !data.project) throw new Error("Project not found");
      const p = data.project;
      const project: TProject = {
        id: p.id,
        name: p.name,
        thumbnail: p.thumbnail ?? "",
        scenes: data.scenes.map((s) => ({
          id: s.id,
          name: s.name,
          isMain: !!s.isMain,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt ?? s.createdAt),
        })),
        currentSceneId: p.currentSceneId ?? "",
        backgroundColor: p.backgroundColor ?? "#000000",
        backgroundType: (p.backgroundType as "color" | "blur") ?? "color",
        blurIntensity: p.blurIntensity ?? 8,
        bookmarks: p.bookmarksJson ? JSON.parse(p.bookmarksJson) : [],
        fps: p.fps ?? 30,
        canvasSize: {
          width: p.canvasWidth ?? 1920,
          height: p.canvasHeight ?? 1080,
        },
        canvasMode: (p.canvasMode as "preset" | "custom") ?? "preset",
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      };
      set({ activeProject: project });
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentProject: async () => {
    const { activeProject } = get();
    if (!activeProject) return;
    await trpcClient.editor.projects.updateSettings.mutate({
      id: activeProject.id,
      backgroundType: activeProject.backgroundType,
      backgroundColor: activeProject.backgroundColor,
      blurIntensity: activeProject.blurIntensity,
      fps: activeProject.fps,
      canvasMode: activeProject.canvasMode,
      canvasWidth: activeProject.canvasSize.width,
      canvasHeight: activeProject.canvasSize.height,
      bookmarks: activeProject.bookmarks,
      currentSceneId: activeProject.currentSceneId,
    });
    await get().loadAllProjects();
  },

  renameProject: async (id: string, name: string) => {
    await trpcClient.editor.projects.rename.mutate({ id, name });
    const { activeProject } = get();
    if (activeProject?.id === id) {
      await get().loadProject(id);
    }
    await get().loadAllProjects();
  },

  updateProjectFps: async (fps: number) => {
    const { activeProject } = get();
    if (!activeProject) return;
    const updated = { ...activeProject, fps, updatedAt: new Date() };
    set({ activeProject: updated });
    await trpcClient.editor.projects.updateSettings.mutate({ id: activeProject.id, fps });
    await get().loadAllProjects();
  },

  updateCanvasSize: async (size, mode) => {
    const { activeProject } = get();
    if (!activeProject) return;
    const updated = {
      ...activeProject,
      canvasSize: size,
      canvasMode: mode === "original" ? "custom" : (mode as "preset" | "custom"),
      updatedAt: new Date(),
    };
    set({ activeProject: updated });
    await trpcClient.editor.projects.updateSettings.mutate({
      id: activeProject.id,
      canvasWidth: size.width,
      canvasHeight: size.height,
      canvasMode: updated.canvasMode,
    });
    await get().loadAllProjects();
  },

  updateBackgroundType: async (type, opts) => {
    const { activeProject } = get();
    if (!activeProject) return;
    const updated = {
      ...activeProject,
      backgroundType: type,
      backgroundColor: opts?.backgroundColor ?? activeProject.backgroundColor,
      blurIntensity: opts?.blurIntensity ?? activeProject.blurIntensity,
      updatedAt: new Date(),
    };
    set({ activeProject: updated });
    await trpcClient.editor.projects.updateSettings.mutate({
      id: activeProject.id,
      backgroundType: type,
      backgroundColor: updated.backgroundColor,
      blurIntensity: updated.blurIntensity,
    });
    await get().loadAllProjects();
  },

  toggleBookmark: async (time: number) => {
    const { activeProject } = get();
    if (!activeProject) return;
    const fps = activeProject.fps || DEFAULT_FPS;
    const frameTime = Math.round(time * fps) / fps;
    const idx = activeProject.bookmarks.findIndex((b) => Math.abs(b - frameTime) < 0.001);
    const bookmarks =
      idx !== -1
        ? activeProject.bookmarks.filter((_, i) => i !== idx)
        : [...activeProject.bookmarks, frameTime].sort((a, b) => a - b);
    const updated = { ...activeProject, bookmarks, updatedAt: new Date() };
    set({ activeProject: updated });
    await trpcClient.editor.projects.updateSettings.mutate({
      id: activeProject.id,
      bookmarks,
    });
    await get().loadAllProjects();
  },

  isBookmarked: (time: number) => {
    const { activeProject } = get();
    if (!activeProject) return false;
    const fps = activeProject.fps || DEFAULT_FPS;
    const frameTime = Math.round(time * fps) / fps;
    return activeProject.bookmarks.some((b) => Math.abs(b - frameTime) < 0.001);
  },

  deleteProject: async (id: string) => {
    await trpcClient.editor.projects.delete.mutate({ id });
    const { activeProject } = get();
    if (activeProject?.id === id) set({ activeProject: null });
    await get().loadAllProjects();
  },

  duplicateProject: async (id: string) => {
    const result = await trpcClient.editor.projects.duplicate.mutate({ id });
    await get().loadAllProjects();
    return result.id;
  },

  closeProject: () => {
    set({ activeProject: null });
  },

  getFilteredAndSortedProjects: (search, sort) => {
    const { savedProjects } = get();
    const filtered = savedProjects.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    const [key, order] = sort.split("-");
    return [...filtered].sort((a, b) => {
      const aVal = (a as any)[key];
      const bVal = (b as any)[key];
      if (aVal === undefined || bVal === undefined) return 0;
      if (order === "asc") return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });
  },

  isInvalidProjectId: (id: string) => get().invalidProjectIds.has(id),
  markProjectIdAsInvalid: (id: string) =>
    set((s) => ({ invalidProjectIds: new Set([...s.invalidProjectIds, id]) })),
  clearInvalidProjectIds: () => set({ invalidProjectIds: new Set() }),
}));
