import { z } from "zod";
import { randomUUID } from "node:crypto";
import { t, publicProcedure } from "@/api/trpc";
import db from "@/api/db";
import { eq } from "drizzle-orm";
import { editorMedia, type NewEditorMedia } from "@/api/db/schema";

const now = () => Date.now();

export const mediaRouter = t.router({
  add: publicProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        id: z.string().optional(),
        name: z.string().min(1),
        type: z.string().min(1),
        filePath: z.string().min(1),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
        duration: z.number().int().optional(),
        size: z.number().int().optional(),
        ephemeral: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = input.id ?? randomUUID();
      const row: NewEditorMedia = {
        id,
        projectId: input.projectId,
        name: input.name,
        type: input.type,
        width: input.width,
        height: input.height,
        duration: input.duration,
        size: input.size,
        ephemeral: input.ephemeral,
        filePath: input.filePath,
        createdAt: now(),
        updatedAt: now(),
      };
      await db.insert(editorMedia).values(row);
      return { id };
    }),

  listForProject: publicProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(editorMedia)
        .where(eq(editorMedia.projectId, input.projectId));
      return rows;
    }),

  remove: publicProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    await db.delete(editorMedia).where(eq(editorMedia.id, input.id));
    return { ok: true };
  }),

  removeAllForProject: publicProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db.delete(editorMedia).where(eq(editorMedia.projectId, input.projectId));
      return { ok: true };
    }),
});

export type MediaRouter = typeof mediaRouter;
