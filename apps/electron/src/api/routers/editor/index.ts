import { t } from "@/api/trpc";
import { projectsRouter } from "./projects";
import { mediaRouter } from "./media";
import { timelineRouter } from "./timeline";

export const editorRouter = t.router({
  projects: projectsRouter,
  media: mediaRouter,
  timeline: timelineRouter,
});

export type EditorRouter = typeof editorRouter;
