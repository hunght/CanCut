import { create } from "zustand";
import { editorStorage, type TProject } from "@/services/editor-storage";

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
      const projects = await editorStorage.loadAllProjects();
      set({ savedProjects: projects });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  createNewProject: async (name: string) => {
    const project = createDefaultProject(name);
    set({ activeProject: project });
    await editorStorage.saveProject({ project });
    await get().loadAllProjects();
    return project.id;
  },

  loadProject: async (id: string) => {
    set({ isLoading: true });
    try {
      const project = await editorStorage.loadProject({ id });
      if (!project) throw new Error("Project not found");
      set({ activeProject: project });
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentProject: async () => {
    const { activeProject } = get();
    if (!activeProject) return;
    await editorStorage.saveProject({ project: { ...activeProject, updatedAt: new Date() } });
    await get().loadAllProjects();
  },

  renameProject: async (id: string, name: string) => {
    const { savedProjects, activeProject } = get();
    const found = savedProjects.find((p) => p.id === id);
    if (!found) return;
    const updated = { ...found, name, updatedAt: new Date() };
    set({ activeProject: activeProject?.id === id ? updated : activeProject });
    await editorStorage.saveProject({ project: updated });
    await get().loadAllProjects();
  },

  updateProjectFps: async (fps: number) => {
    const { activeProject } = get();
    if (!activeProject) return;
    const updated = { ...activeProject, fps, updatedAt: new Date() };
    set({ activeProject: updated });
    await editorStorage.saveProject({ project: updated });
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
    await editorStorage.saveProject({ project: updated });
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
    await editorStorage.saveProject({ project: updated });
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
    await editorStorage.saveProject({ project: updated });
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
    await editorStorage.deleteProject({ id });
    const { activeProject } = get();
    if (activeProject?.id === id) set({ activeProject: null });
    await get().loadAllProjects();
  },

  duplicateProject: async (id: string) => {
    const project = await editorStorage.loadProject({ id });
    if (!project) throw new Error("Project not found");
    const baseMatch = project.name.match(/^(?:\(\d+\)\s+)?(.+)$/);
    const baseName = baseMatch ? baseMatch[1] : project.name;
    const existing = get()
      .savedProjects.map((p) => p.name.match(/^\((\d+)\)\s+(.+)$/))
      .filter((m) => m && m[2] === baseName)
      .map((m) => Number(m![1]));
    const nextNum = existing.length ? Math.max(...existing) + 1 : 1;
    const cloned: TProject = {
      ...project,
      id: randomUUID(),
      name: `(${nextNum}) ${baseName}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await editorStorage.saveProject({ project: cloned });
    await get().loadAllProjects();
    return cloned.id;
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
