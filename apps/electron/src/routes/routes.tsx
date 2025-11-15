import { createRoute } from "@tanstack/react-router";
import { RootRoute } from "./__root";
import EditorPage from "@/pages/editor/EditorPage";

const EditorRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/editor",
  component: EditorPage,
});

export const rootTree = RootRoute.addChildren([EditorRoute]);
