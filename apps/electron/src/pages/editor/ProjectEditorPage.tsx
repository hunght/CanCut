import { useEffect, useState } from "react";
import { useParams, useRouter } from "@tanstack/react-router";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { MediaPanel } from "@/components/editor/media-panel";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { Timeline } from "@/components/editor/timeline";
import { PreviewPanel } from "@/components/editor/preview-panel";
import { EditorHeader } from "@/components/editor/editor-header";
import { usePanelStore } from "@/stores/panel-store";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { Button } from "@/components/ui/button";

export default function ProjectEditorPage() {
  const { projectId } = useParams({ from: "/editor/$projectId" });
  const router = useRouter();
  const { activeProject, loadProject } = useProjectStore();
  const { loadProjectTimeline } = useTimelineStore();
  const [error, setError] = useState<string | null>(null);

  const {
    toolsPanel,
    previewPanel,
    mainContent,
    timeline,
    setToolsPanel,
    setPreviewPanel,
    setMainContent,
    setTimeline,
    propertiesPanel,
    setPropertiesPanel,
    activePreset,
    resetCounter,
  } = usePanelStore();

  useEffect(() => {
    let mounted = true;
    setError(null);
    (async () => {
      try {
        await loadProject(projectId);
        if (!mounted) return;
        const sceneId = useProjectStore.getState().activeProject?.currentSceneId;
        await loadProjectTimeline({ projectId, sceneId });
      } catch (err) {
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : "Failed to load project";
        setError(errorMessage);
        console.error("Failed to load project:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, loadProject, loadProjectTimeline]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-4">
        <p className="text-destructive">{error}</p>
        <Button
          onClick={() => router.navigate({ to: "/projects" })}
          variant="default"
        >
          Go to Projects
        </Button>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <EditorHeader />
      <div className="min-h-0 min-w-0 flex-1">
        {activePreset === "media" ? (
          <ResizablePanelGroup
            key={`media-${activePreset}-${resetCounter}`}
            direction="horizontal"
            className="h-full w-full gap-[0.18rem] px-3 pb-3"
          >
            <ResizablePanel
              defaultSize={toolsPanel}
              minSize={15}
              maxSize={40}
              onResize={setToolsPanel}
              className="min-w-0 rounded-sm"
            >
              <MediaPanel />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={100 - toolsPanel} minSize={60} className="min-h-0 min-w-0">
              <ResizablePanelGroup direction="vertical" className="h-full w-full gap-[0.18rem]">
                <ResizablePanel
                  defaultSize={mainContent}
                  minSize={30}
                  maxSize={85}
                  onResize={setMainContent}
                  className="min-h-0"
                >
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full w-full gap-[0.19rem]"
                  >
                    <ResizablePanel
                      defaultSize={previewPanel}
                      minSize={30}
                      onResize={setPreviewPanel}
                      className="min-h-0 min-w-0 flex-1"
                    >
                      <PreviewPanel />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel
                      defaultSize={propertiesPanel}
                      minSize={15}
                      maxSize={40}
                      onResize={setPropertiesPanel}
                      className="min-w-0"
                    >
                      <PropertiesPanel />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel
                  defaultSize={timeline}
                  minSize={15}
                  maxSize={70}
                  onResize={setTimeline}
                  className="min-h-0"
                >
                  <Timeline />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : activePreset === "inspector" ? (
          <ResizablePanelGroup
            key={`inspector-${activePreset}-${resetCounter}`}
            direction="horizontal"
            className="h-full w-full gap-[0.18rem] px-3 pb-3"
          >
            <ResizablePanel
              defaultSize={100 - propertiesPanel}
              minSize={30}
              onResize={(size) => setPropertiesPanel(100 - size)}
              className="min-h-0 min-w-0"
            >
              <ResizablePanelGroup direction="vertical" className="h-full w-full gap-[0.18rem]">
                <ResizablePanel
                  defaultSize={mainContent}
                  minSize={30}
                  maxSize={85}
                  onResize={setMainContent}
                  className="min-h-0"
                >
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full w-full gap-[0.19rem]"
                  >
                    <ResizablePanel
                      defaultSize={toolsPanel}
                      minSize={15}
                      maxSize={40}
                      onResize={setToolsPanel}
                      className="min-w-0 rounded-sm"
                    >
                      <MediaPanel />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel
                      defaultSize={previewPanel}
                      minSize={30}
                      onResize={setPreviewPanel}
                      className="min-h-0 min-w-0 flex-1"
                    >
                      <PreviewPanel />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel
                  defaultSize={timeline}
                  minSize={15}
                  maxSize={70}
                  onResize={setTimeline}
                  className="min-h-0"
                >
                  <Timeline />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              defaultSize={propertiesPanel}
              minSize={15}
              maxSize={40}
              onResize={setPropertiesPanel}
              className="min-h-0 min-w-0"
            >
              <PropertiesPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : activePreset === "vertical-preview" ? (
          <ResizablePanelGroup
            key={`vertical-preview-${activePreset}-${resetCounter}`}
            direction="horizontal"
            className="h-full w-full gap-[0.18rem] px-3 pb-3"
          >
            <ResizablePanel
              defaultSize={100 - previewPanel}
              minSize={30}
              onResize={(size) => setPreviewPanel(100 - size)}
              className="min-h-0 min-w-0"
            >
              <ResizablePanelGroup direction="vertical" className="h-full w-full gap-[0.18rem]">
                <ResizablePanel
                  defaultSize={mainContent}
                  minSize={30}
                  maxSize={85}
                  onResize={setMainContent}
                  className="min-h-0"
                >
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full w-full gap-[0.19rem]"
                  >
                    <ResizablePanel
                      defaultSize={toolsPanel}
                      minSize={15}
                      maxSize={40}
                      onResize={setToolsPanel}
                      className="min-w-0 rounded-sm"
                    >
                      <MediaPanel />
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel
                      defaultSize={propertiesPanel}
                      minSize={15}
                      maxSize={40}
                      onResize={setPropertiesPanel}
                      className="min-w-0"
                    >
                      <PropertiesPanel />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel
                  defaultSize={timeline}
                  minSize={15}
                  maxSize={70}
                  onResize={setTimeline}
                  className="min-h-0"
                >
                  <Timeline />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              defaultSize={previewPanel}
              minSize={30}
              onResize={setPreviewPanel}
              className="min-h-0 min-w-0"
            >
              <PreviewPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ResizablePanelGroup
            key={`default-${activePreset}-${resetCounter}`}
            direction="vertical"
            className="h-full w-full gap-[0.18rem]"
          >
            <ResizablePanel
              defaultSize={mainContent}
              minSize={30}
              maxSize={85}
              onResize={setMainContent}
              className="min-h-0"
            >
              {/* Main content area */}
              <ResizablePanelGroup
                direction="horizontal"
                className="h-full w-full gap-[0.19rem] px-3"
              >
                {/* Tools Panel */}
                <ResizablePanel
                  defaultSize={toolsPanel}
                  minSize={15}
                  maxSize={40}
                  onResize={setToolsPanel}
                  className="min-w-0 rounded-sm"
                >
                  <MediaPanel />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Preview Area */}
                <ResizablePanel
                  defaultSize={previewPanel}
                  minSize={30}
                  onResize={setPreviewPanel}
                  className="min-h-0 min-w-0 flex-1"
                >
                  <PreviewPanel />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel
                  defaultSize={propertiesPanel}
                  minSize={15}
                  maxSize={40}
                  onResize={setPropertiesPanel}
                  className="min-w-0 rounded-sm"
                >
                  <PropertiesPanel />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Timeline */}
            <ResizablePanel
              defaultSize={timeline}
              minSize={15}
              maxSize={70}
              onResize={setTimeline}
              className="min-h-0 px-3 pb-3"
            >
              <Timeline />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
