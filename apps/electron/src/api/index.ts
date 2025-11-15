import { t } from "./trpc";
import { editorRouter } from "@/api/routers/editor";
import { utilsRouter } from "@/api/routers/utils";

// Create the root router
export const router = t.router({
  editor: editorRouter,
  utils: utilsRouter,
});

// Export type router type signature
export type AppRouter = typeof router;
