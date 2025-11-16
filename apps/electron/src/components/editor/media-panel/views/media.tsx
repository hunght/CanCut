import { CloudUpload, Video, Music, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project-store";
import {
  useMediaStore,
  getFileType,
  getImageDimensions,
  getMediaDuration,
  generateVideoThumbnail,
  type MediaFile,
} from "@/stores/media-store";
import { cn } from "@/lib/utils";
import { useTimelineStore } from "@/stores/timeline-store";
import { usePlaybackStore } from "@/stores/playback-store";

export function MediaView() {
  const { activeProject } = useProjectStore();
  const { mediaFiles, addMediaFile, loadProjectMedia, removeMediaFile } = useMediaStore();
  const { addElementToTrack, addTrack, tracks } = useTimelineStore();
  const currentTime = usePlaybackStore((s) => s.currentTime);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // For browser fallback: process FileList
  const processFiles = async (files: FileList) => {
    if (!activeProject) return;
    setIsProcessing(true);
    setProgress(0);
    const total = files.length;
    let completed = 0;
    for (const file of Array.from(files)) {
      const fileType = getFileType(file);
      if (!fileType) continue;
      try {
        const filePath = (file as any).path || URL.createObjectURL(file);
        const url = `file://${filePath}`;
        let thumbnailUrl: string | undefined;
        let width: number | undefined;
        let height: number | undefined;
        let duration: number | undefined;
        if (fileType === "image") {
          const dims = await getImageDimensions(file);
          width = dims.width;
          height = dims.height;
        } else if (fileType === "video") {
          const videoData = await generateVideoThumbnail(file);
          thumbnailUrl = videoData.thumbnailUrl;
          width = videoData.width;
          height = videoData.height;
          duration = await getMediaDuration(file);
        } else if (fileType === "audio") {
          duration = await getMediaDuration(file);
        }
        await addMediaFile(activeProject.id, {
          name: file.name,
          type: fileType,
          filePath,
          url,
          thumbnailUrl,
          width,
          height,
          duration,
          size: file.size,
        });
        completed++;
        setProgress(Math.round((completed / total) * 100));
      } catch (error) {
        console.error("Error processing file:", file.name, error);
      }
    }
    setIsProcessing(false);
    setProgress(0);
  };

  useEffect(() => {
    if (activeProject?.id) {
      loadProjectMedia(activeProject.id);
    }
  }, [activeProject?.id, loadProjectMedia]);

  const handleFileSelect = async () => {
    if (!(window as any).electron?.selectMediaFiles) {
      // Fallback to input if not in Electron
      fileInputRef.current?.click();
      return;
    }
    const filePaths: string[] = await (window as any).electron.selectMediaFiles();
    if (!filePaths || filePaths.length === 0) return;
    await processFilePaths(filePaths);
  };

  // For Electron: process array of file paths
  const processFilePaths = async (filePaths: string[]) => {
    if (!activeProject) return;
    setIsProcessing(true);
    setProgress(0);
    const total = filePaths.length;
    let completed = 0;
    for (const filePath of filePaths) {
      try {
        // Get file metadata using Node.js APIs via preload (or minimal info)
        // For now, just use filePath and name
        const name = filePath.split(/[/\\]/).pop() ?? filePath;
        const url = `file://${filePath}`;
        // TODO: Optionally extract width, height, duration, thumbnail if needed
        await addMediaFile(activeProject.id, {
          name,
          type: "video", // Could improve by inferring from extension
          filePath,
          url,
        });
        completed++;
        setProgress(Math.round((completed / total) * 100));
      } catch (error) {
        console.error("Error processing file path:", filePath, error);
      }
    }
    setIsProcessing(false);
    setProgress(0);
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Fallback for browser: process FileList
    await processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ...existing code...
  const handleRemove = async (id: string) => {
    if (!activeProject) return;
    await removeMediaFile(activeProject.id, id);
  };

  const formatDuration = (duration: number) => {
    const min = Math.floor(duration / 60);
    const sec = Math.floor(duration % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  if (!activeProject) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">No active project</p>
      </div>
    );
  }

  const filteredMedia = mediaFiles.filter((item) => !item.ephemeral);

  const handleAddToTimeline = (item: MediaFile) => {
    // Prefer main track, otherwise first media track, otherwise create one
    let targetTrackId =
      tracks.find((t) => t.isMain)?.id ||
      tracks.find((t) => t.type === "media")?.id ||
      addTrack("media");

    const safeDuration = Math.max(1, Math.round(item.duration ?? 5));

    addElementToTrack(targetTrackId, {
      type: "media",
      name: item.name,
      startTime: currentTime,
      duration: safeDuration,
      trimStart: 0,
      trimEnd: 0,
      mediaId: item.id,
    });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        onChange={handleFilesChange}
        className="hidden"
      />

      <div className="border-b px-4 py-3">
        <Button onClick={handleFileSelect} disabled={isProcessing} size="sm" className="w-full">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing {progress}%
            </>
          ) : (
            <>
              <CloudUpload className="mr-2 size-4" />
              Add Media
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredMedia.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-muted p-6">
              <CloudUpload className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">No media in this project</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add videos, images, or audio files to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, 160px)" }}>
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
              >
                <div className="aspect-video w-full">
                  {item.type === "image" ? (
                    <img src={item.url} alt={item.name} className="size-full object-cover" />
                  ) : item.type === "video" && item.thumbnailUrl ? (
                    <div className="relative size-full">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Video className="size-6 text-white drop-shadow-md" />
                      </div>
                      {item.duration && (
                        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
                          {formatDuration(item.duration)}
                        </div>
                      )}
                    </div>
                  ) : item.type === "audio" ? (
                    <div className="flex size-full flex-col items-center justify-center border border-green-500/20 bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                      <Music className="mb-1 size-6" />
                      {item.duration && (
                        <span className="text-xs opacity-70">{formatDuration(item.duration)}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted">
                      <ImageIcon className="size-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs" title={item.name}>
                    {item.name}
                  </p>
                </div>
                {/* Hover actions */}
                <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="pointer-events-auto h-7 w-7"
                    onClick={() => handleAddToTimeline(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleAddToTimeline(item);
                      }
                    }}
                    aria-label="Add to timeline"
                    title="Add to timeline"
                  >
                    +
                  </Button>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-xs text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
