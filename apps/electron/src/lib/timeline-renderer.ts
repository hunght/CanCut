import { videoCache } from "./video-cache";
import { useTimelineStore } from "@/stores/timeline-store";
import { useMediaStore } from "@/stores/media-store";
import { useProjectStore } from "@/stores/project-store";

export async function renderTimelineFrame({
  ctx,
  time,
  canvasWidth,
  canvasHeight,
}: {
  ctx: CanvasRenderingContext2D;
  time: number;
  canvasWidth: number;
  canvasHeight: number;
}): Promise<void> {
  const tracks = useTimelineStore.getState().tracks;
  const mediaFiles = useMediaStore.getState().mediaFiles;
  const project = useProjectStore.getState().activeProject;

  // Background
  ctx.save();
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const bgColor = project?.backgroundType === "color" ? project.backgroundColor : "#000000";
  ctx.fillStyle = bgColor ?? "#000000";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.restore();

  // Gather active media elements (media tracks only), later elements drawn on top
  const active: Array<{ element: { startTime: number; duration: number; trimStart: number; trimEnd: number; mediaId?: string }; mediaUrl?: string; width?: number; height?: number; type?: string }> = [];
  for (const track of tracks) {
    if (track.muted || track.type === "text") continue;
    for (const el of track.elements) {
      const localTime = time - el.startTime;
      if (localTime < -0.0001) continue;
      const visibleDuration = Math.max(0, el.duration - el.trimStart - el.trimEnd);
      if (localTime > visibleDuration + 0.0001) continue;
      const mediaId = el.mediaId;
      if (!mediaId) continue;
      const mediaItem = mediaFiles.find((m) => m.id === mediaId);
      if (!mediaItem) continue;
      active.push({
        element: el,
        mediaUrl: mediaItem.url || `file://${mediaItem.filePath}`,
        width: mediaItem.width,
        height: mediaItem.height,
        type: mediaItem.type,
      });
    }
  }

  for (const item of active) {
    if (item.type === "image" && item.mediaUrl) {
      const img = await loadImage(item.mediaUrl);
      const { drawX, drawY, drawW, drawH } = containFit(img.naturalWidth, img.naturalHeight, canvasWidth, canvasHeight);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      continue;
    }
    if (item.type === "video" && item.mediaUrl) {
      const localTime = time - item.element.startTime + item.element.trimStart;
      const frameCanvas = await videoCache.getFrameAt(item.element.mediaId || "", item.mediaUrl, localTime);
      if (!frameCanvas) continue;
      const { drawX, drawY, drawW, drawH } = containFit(frameCanvas.width, frameCanvas.height, canvasWidth, canvasHeight);
      ctx.drawImage(frameCanvas, drawX, drawY, drawW, drawH);
      continue;
    }
  }
}

function containFit(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.min(dstW / Math.max(1, srcW), dstH / Math.max(1, srcH));
  const drawW = Math.max(1, Math.floor(srcW * scale));
  const drawH = Math.max(1, Math.floor(srcH * scale));
  const drawX = Math.floor((dstW - drawW) / 2);
  const drawY = Math.floor((dstH - drawH) / 2);
  return { drawX, drawY, drawW, drawH };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isHttp = /^https?:\/\//i.test(src);
    if (isHttp) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}


