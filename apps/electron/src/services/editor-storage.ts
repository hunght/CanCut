import { trpcClient } from "@/utils/trpc";

export type CanvasSize = { width: number; height: number };
export type Scene = { id: string; name: string; isMain: boolean; createdAt: Date; updatedAt: Date };
export type TProject = {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
  scenes: Scene[];
  currentSceneId: string;
  backgroundColor: string;
  backgroundType: "color" | "blur";
  blurIntensity: number;
  bookmarks: number[];
  fps: number;
  canvasSize: CanvasSize;
  canvasMode: "preset" | "custom";
};

function fromDbProject(row: any, scenes: any[]): TProject {
  const bookmarks: number[] = row.bookmarksJson ? JSON.parse(row.bookmarksJson) : [];
  return {
    id: row.id,
    name: row.name,
    thumbnail: row.thumbnail ?? "",
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt ?? row.createdAt),
    scenes: scenes.map((s) => ({
      id: s.id,
      name: s.name,
      isMain: !!s.isMain,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt ?? s.createdAt),
    })),
    currentSceneId: row.currentSceneId ?? scenes.find((s) => s.isMain)?.id ?? scenes[0]?.id ?? "",
    backgroundColor: row.backgroundColor ?? "#000000",
    backgroundType: (row.backgroundType as "color" | "blur") ?? "color",
    blurIntensity: row.blurIntensity ?? 8,
    bookmarks,
    fps: row.fps ?? 30,
    canvasSize: {
      width: row.canvasWidth ?? 1920,
      height: row.canvasHeight ?? 1080,
    },
    canvasMode: (row.canvasMode as "preset" | "custom") ?? "preset",
  };
}

export const editorStorage = {
  async saveProject({ project }: { project: TProject }): Promise<void> {
    await trpcClient.editor.projects.updateSettings.mutate({
      id: project.id,
      backgroundType: project.backgroundType,
      backgroundColor: project.backgroundColor,
      blurIntensity: project.blurIntensity,
      fps: project.fps,
      canvasMode: project.canvasMode,
      canvasWidth: project.canvasSize.width,
      canvasHeight: project.canvasSize.height,
      bookmarks: project.bookmarks,
      currentSceneId: project.currentSceneId,
    });
  },

  async loadProject({ id }: { id: string }): Promise<TProject | null> {
    const res = await trpcClient.editor.projects.get.query({ id });
    if (!res) return null;
    return fromDbProject(res.project, res.scenes);
  },

  async loadAllProjects(): Promise<TProject[]> {
    const rows = await trpcClient.editor.projects.list.query();
    const projects: TProject[] = [];
    for (const row of rows) {
      const full = await trpcClient.editor.projects.get.query({ id: row.id });
      if (full) projects.push(fromDbProject(full.project, full.scenes));
    }
    return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  async deleteProject({ id }: { id: string }): Promise<void> {
    await trpcClient.editor.media.removeAllForProject.mutate({ projectId: id });
    await trpcClient.editor.timeline.deleteForProject.mutate({ projectId: id });
    await trpcClient.editor.projects.delete.mutate({ id });
  },

  async saveTimeline({
    projectId,
    sceneId,
    tracksJson,
  }: {
    projectId: string;
    sceneId?: string;
    tracksJson: string;
  }): Promise<void> {
    await trpcClient.editor.timeline.save.mutate({ projectId, sceneId, tracksJson });
  },

  async loadTimeline({
    projectId,
    sceneId,
  }: {
    projectId: string;
    sceneId?: string;
  }): Promise<string | null> {
    const t = await trpcClient.editor.timeline.load.query({ projectId, sceneId });
    return t?.tracksJson ?? null;
  },
};

export type EditorStorage = typeof editorStorage;
