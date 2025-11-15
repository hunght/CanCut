import { z } from "zod";
import { randomUUID } from "node:crypto";
import { t, publicProcedure } from "@/api/trpc";
import db from "@/api/db";
import { eq, and } from "drizzle-orm";
import {
  editorProjects,
  editorScenes,
  type NewEditorProject,
  type NewEditorScene,
} from "@/api/db/schema";

const uuid = () => randomUUID();
const now = () => Date.now();

export const projectsRouter = t.router({
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const projectId = uuid();
      const mainSceneId = uuid();

      const project: NewEditorProject = {
        id: projectId,
        name: input.name,
        thumbnail: "",
        backgroundType: "color",
        backgroundColor: "#000000",
        blurIntensity: 8,
        bookmarksJson: JSON.stringify([]),
        fps: 30,
        canvasMode: "preset",
        canvasWidth: 1920,
        canvasHeight: 1080,
        currentSceneId: mainSceneId,
        createdAt: now(),
        updatedAt: now(),
      };

      const scene: NewEditorScene = {
        id: mainSceneId,
        projectId,
        name: "Main Scene",
        isMain: true,
        createdAt: now(),
        updatedAt: now(),
      };

      await db.insert(editorProjects).values(project);
      await db.insert(editorScenes).values(scene);

      return { id: projectId };
    }),

  get: publicProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    const rows = await db.select().from(editorProjects).where(eq(editorProjects.id, input.id));
    const project = rows.at(0) || null;
    if (!project) return null;
    const scenes = await db.select().from(editorScenes).where(eq(editorScenes.projectId, input.id));
    return { project, scenes };
  }),

  list: publicProcedure.query(async () => {
    const rows = await db.select().from(editorProjects);
    return rows.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }),

  rename: publicProcedure
    .input(z.object({ id: z.string().min(1), name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db
        .update(editorProjects)
        .set({ name: input.name, updatedAt: now() })
        .where(eq(editorProjects.id, input.id));
      return { ok: true };
    }),

  updateSettings: publicProcedure
    .input(
      z.object({
        id: z.string().min(1),
        backgroundType: z.string().optional(),
        backgroundColor: z.string().optional(),
        blurIntensity: z.number().int().optional(),
        fps: z.number().int().optional(),
        canvasMode: z.string().optional(),
        canvasWidth: z.number().int().optional(),
        canvasHeight: z.number().int().optional(),
        bookmarks: z.array(z.number()).optional(),
        currentSceneId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, bookmarks, ...rest } = input;
      const update: Record<string, unknown> = { ...rest, updatedAt: now() };
      if (bookmarks) update["bookmarksJson"] = JSON.stringify(bookmarks);
      await db.update(editorProjects).set(update).where(eq(editorProjects.id, id));
      return { ok: true };
    }),

  delete: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    await db.delete(editorScenes).where(eq(editorScenes.projectId, input.id));
    await db.delete(editorProjects).where(eq(editorProjects.id, input.id));
    return { ok: true };
  }),

  duplicate: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const rows = await db.select().from(editorProjects).where(eq(editorProjects.id, input.id));
      const original = rows.at(0);
      if (!original) throw new Error("Project not found");

      const newId = uuid();
      const newName = `(1) ${original.name}`;
      const project: NewEditorProject = {
        ...original,
        id: newId,
        name: newName,
        createdAt: now(),
        updatedAt: now(),
      };
      await db.insert(editorProjects).values(project);

      const scenes = await db
        .select()
        .from(editorScenes)
        .where(eq(editorScenes.projectId, input.id));
      if (scenes.length) {
        const clonedScenes = scenes.map(
          (s) =>
            ({
              ...s,
              id: uuid(),
              projectId: newId,
              createdAt: now(),
              updatedAt: now(),
            }) satisfies NewEditorScene
        );
        await db.insert(editorScenes).values(clonedScenes);
      }

      return { id: newId };
    }),
});

export type ProjectsRouter = typeof projectsRouter;
