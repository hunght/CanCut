import { createRoute } from "@tanstack/react-router";
import { RootRoute } from "./__root";
import ProjectEditorPage from "@/pages/editor/ProjectEditorPage";

const ProjectEditorRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/editor/$projectId",
  component: ProjectEditorPage,
});

const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: () => (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Select a project from the sidebar or create a new one
    </div>
  ),
});

export const rootTree = RootRoute.addChildren([IndexRoute, ProjectEditorRoute]);
