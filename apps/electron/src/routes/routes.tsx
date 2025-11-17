import { createRoute } from "@tanstack/react-router";
import { RootRoute } from "./__root";
import ProjectEditorPage from "@/pages/editor/ProjectEditorPage";
import { useProjectStore } from "@/stores/project-store";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function ProjectsPage() {
  const { createNewProject } = useProjectStore();
  const router = useRouter();

  const handleCreateProject = async () => {
    try {
      const projectId = await createNewProject("Untitled Project");
      router.navigate({ to: `/editor/${projectId}` });
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground">
          Select a project from the sidebar or create a new one
        </p>
        <Button onClick={handleCreateProject} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Project
        </Button>
      </div>
    </div>
  );
}

const ProjectEditorRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/editor/$projectId",
  component: ProjectEditorPage,
});

const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: ProjectsPage,
});

const ProjectsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const BlogRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/blog",
  component: () => (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Blog
    </div>
  ),
});

const ContributorsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/contributors",
  component: () => (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Contributors
    </div>
  ),
});

export const rootTree = RootRoute.addChildren([
  IndexRoute,
  ProjectEditorRoute,
  ProjectsRoute,
  BlogRoute,
  ContributorsRoute,
]);
