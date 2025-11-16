import { Button } from "../ui/button";
import { ChevronDown, Save } from "lucide-react";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { PanelPresetSelector } from "./panel-preset-selector";

export function EditorHeader() {
  const { activeProject, saveCurrentProject } = useProjectStore();
  const { saveProjectTimeline } = useTimelineStore();

  const handleSave = () => {
    if (activeProject) {
      saveProjectTimeline(activeProject.id, activeProject.currentSceneId);
      saveCurrentProject();
    }
  };

  return (
    <div className="flex h-[3.2rem] items-center justify-between border-b bg-background px-3">
      <div className="flex items-center gap-2">
        <Button variant="secondary" className="flex h-auto items-center px-2.5 py-1.5">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <span className="mr-2 text-[0.85rem]">{activeProject?.name || "Untitled"}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <PanelPresetSelector />
        <Button onClick={handleSave} size="sm" variant="default">
          <Save className="mr-1.5 h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
