import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { Button } from "@/components/ui/button";

export default function ProjectEditorPage() {
  const { projectId } = useParams({ from: "/editor/$projectId" });
  const { activeProject, loadProject, saveCurrentProject } = useProjectStore();
  const { loadProjectTimeline, saveProjectTimeline, getTotalDuration } = useTimelineStore();

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadProject(projectId);
      if (!mounted) return;
      const sceneId = useProjectStore.getState().activeProject?.currentSceneId;
      await loadProjectTimeline(projectId, sceneId);
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, loadProject, loadProjectTimeline]);

  const durationSec = getTotalDuration().toFixed(2);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="truncate text-lg font-semibold">{activeProject?.name ?? "Loading…"}</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">Duration: {durationSec}s</div>
          <Button
            type="button"
            onClick={() => {
              saveProjectTimeline(projectId, activeProject?.currentSceneId);
              saveCurrentProject();
            }}
          >
            Save
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="rounded border p-4 text-sm text-muted-foreground">
          Editor UI coming next — project and timeline are loaded and persisted locally.
        </div>
      </main>
    </div>
  );
}
