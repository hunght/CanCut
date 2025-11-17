import { createRoute } from "@tanstack/react-router";
import { RootRoute } from "./__root";
import ProjectEditorPage from "@/pages/editor/ProjectEditorPage";
import { useProjectStore } from "@/stores/project-store";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, Video, Calendar } from "lucide-react";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TProject } from "@/types/project";

function ProjectsPage() {
  const {
    savedProjects,
    isLoading,
    isInitialized,
    createNewProject,
    loadAllProjects
  } = useProjectStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) {
      loadAllProjects();
    }
  }, [isInitialized, loadAllProjects]);

  const handleCreateProject = async () => {
    try {
      const projectId = await createNewProject("Untitled Project");
      router.navigate({ to: `/editor/${projectId}` });
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Your Projects</h1>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden border-none p-0">
              <Skeleton className="aspect-square w-full bg-muted/50" />
              <CardContent className="px-0 pt-5 flex flex-col gap-1">
                <Skeleton className="h-4 w-3/4 bg-muted/50" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 bg-muted/50" />
                  <Skeleton className="h-4 w-24 bg-muted/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (savedProjects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">
            No projects yet. Create your first project to get started.
          </p>
          <Button onClick={handleCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Your Projects</h1>
          <p className="text-muted-foreground">
            {savedProjects.length} {savedProjects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <Button onClick={handleCreateProject} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {savedProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: TProject }) {
  const router = useRouter();

  const handleClick = () => {
    router.navigate({ to: `/editor/${project.id}` });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className="overflow-hidden border-none p-0 cursor-pointer group hover:opacity-80 transition-opacity"
      onClick={handleClick}
    >
      <div className="relative aspect-square bg-muted">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted/50 flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardContent className="px-0 pt-5 flex flex-col gap-1">
        <h3 className="font-medium text-sm line-clamp-1">{project.name}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(project.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
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
