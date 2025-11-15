import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { MediaPanel } from "@/components/editor/media-panel";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { Timeline } from "@/components/editor/timeline";
import { PreviewPanel } from "@/components/editor/preview-panel";
import { EditorHeader } from "@/components/editor/editor-header";
import { usePanelStore } from "@/stores/panel-store";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";

export default function ProjectEditorPage() {
  const { projectId } = useParams({ from: "/editor/$projectId" });
  const { activeProject, loadProject } = useProjectStore();
  const { loadProjectTimeline } = useTimelineStore();

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
