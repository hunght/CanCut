import React, { useState, useMemo } from "react";
import { Plus, FileText } from "lucide-react";
import { Link, useMatches, useNavigate } from "@tanstack/react-router";
import { logger } from "@/helpers/logger";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarThemeToggle } from "@/components/SidebarThemeToggle";

export function AppSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>): React.JSX.Element {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const matches = useMatches();
  const currentPath = useMemo(() => matches[matches.length - 1]?.pathname ?? "/", [matches]);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["editor-projects"],
    queryFn: async () => trpcClient.editor.projects.list.query(),
  });

  const createMutation = useMutation({
    mutationFn: async () => trpcClient.editor.projects.create.mutate({ name: "Untitled Project" }),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["editor-projects"] });
      navigate({ to: "/editor/$projectId", params: { projectId: res.id } });
    },
  });

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-primary/20 bg-white/80 backdrop-blur-sm dark:border-primary/10 dark:bg-gray-900/80",
        className
      )}
      {...props}
    >
      <SidebarHeader className="border-b border-primary/20 p-4 dark:border-primary/10">
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="w-full"
          size="sm"
        >
          <Plus className="mr-2 size-4" />
          New Project
        </Button>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarMenu>
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading projects...</div>
          ) : projects && projects.length > 0 ? (
            projects.map((project) => {
              const isActive = currentPath.includes(project.id);
              return (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={project.name}
                    className={cn(
                      "gap-2 text-primary/70 transition-colors dark:text-white/70",
                      "hover:bg-accent/10 hover:text-primary",
                      "dark:hover:bg-accent/5 dark:hover:text-accent",
                      isActive && "bg-accent/10 text-primary dark:bg-accent/5 dark:text-white"
                    )}
                  >
                    <Link
                      to="/editor/$projectId"
                      params={{ projectId: project.id }}
                      onClick={() => {
                        logger.debug("Sidebar navigation", {
                          from: currentPath,
                          to: `/editor/${project.id}`,
                          title: project.name,
                          source: "AppSidebar",
                        });
                        setActiveItem(project.id);
                      }}
                    >
                      <FileText className="size-4" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })
          ) : (
            <div className="p-4 text-sm text-muted-foreground">No projects yet</div>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarThemeToggle />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail className="border-primary/20 dark:border-primary/10" />
    </Sidebar>
  );
}
