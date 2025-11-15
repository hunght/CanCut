import { z } from "zod";
import { randomUUID } from "node:crypto";
import { t, publicProcedure } from "@/api/trpc";
import db from "@/api/db";
import { eq } from "drizzle-orm";
import { editorTimelines, type NewEditorTimeline } from "@/api/db/schema";

const now = () => Date.now();

export const timelineRouter = t.router({
  save: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        projectId: z.string().min(1),
        sceneId: z.string().optional(),
        tracksJson: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const id = input.id ?? randomUUID();
      const payload: NewEditorTimeline = {
        id,
        projectId: input.projectId,
        sceneId: input.sceneId,
        tracksJson: input.tracksJson,
        lastModified: now(),
        createdAt: now(),
        updatedAt: now(),
      };

      await db
        .insert(editorTimelines)
        .values(payload)
        .onConflictDoUpdate({
          target: [editorTimelines.projectId, editorTimelines.sceneId],
          set: {
            tracksJson: payload.tracksJson,
            lastModified: payload.lastModified,
            updatedAt: payload.updatedAt,
          },
        });

      return { id };
    }),

  load: publicProcedure
    .input(z.object({ projectId: z.string().min(1), sceneId: z.string().optional() }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(editorTimelines)
        .where(
          input.sceneId
            ? eq(editorTimelines.sceneId, input.sceneId)
            : eq(editorTimelines.projectId, input.projectId)
        );
      return rows.at(0) ?? null;
    }),

  deleteForProject: publicProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db.delete(editorTimelines).where(eq(editorTimelines.projectId, input.projectId));
      return { ok: true };
    }),
});

export type TimelineRouter = typeof timelineRouter;
