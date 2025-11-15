import { t } from "./trpc";
import { editorRouter } from "@/api/routers/editor";

// Create the root router
export const router = t.router({
  editor: editorRouter,
});

// Export type router type signature
export type AppRouter = typeof router;
