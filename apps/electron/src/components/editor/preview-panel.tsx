import { useEffect, useRef, useState } from "react";
import { usePlaybackStore } from "@/stores/playback-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { useProjectStore } from "@/stores/project-store";
import { createFrameCache } from "@/lib/frame-cache";
import { renderTimelineFrame } from "@/lib/timeline-renderer";

const CACHE_FPS = 24;

export function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const { currentTime, isPlaying } = usePlaybackStore();
  const { tracks } = useTimelineStore();
  const { activeProject } = useProjectStore();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { getCachedFrame, cacheFrame } = createFrameCache();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      setContainerSize({ width: clientWidth, height: clientHeight });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const displayW = Math.max(2, containerSize.width - 16);
    const displayH = Math.max(2, containerSize.height - 16);
    canvas.width = displayW;
    canvas.height = displayH;
  }, [containerSize]);

  useEffect(() => {
    let raf = 0;
    const draw = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      const frameKey = Math.floor(currentTime * CACHE_FPS);
      const timelineHash = JSON.stringify({
        t: frameKey,
        tracksLen: tracks.length,
        projectId: activeProject?.id,
      });
      const cached = getCachedFrame(frameKey, timelineHash);
      if (cached) {
        ctx.putImageData(cached, 0, 0);
      } else {
        if (!offscreenRef.current) {
          offscreenRef.current = document.createElement("canvas");
        }
        const off = offscreenRef.current;
        off.width = w;
        off.height = h;
        const offCtx = off.getContext("2d");
        if (!offCtx) return;
        await renderTimelineFrame({ ctx: offCtx, time: currentTime, canvasWidth: w, canvasHeight: h });
        const imageData = offCtx.getImageData(0, 0, w, h);
        cacheFrame(frameKey, timelineHash, imageData);
        ctx.putImageData(imageData, 0, 0);
      }
      if (isPlaying) {
        raf = requestAnimationFrame(draw);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [currentTime, isPlaying, tracks.length, activeProject?.id, cacheFrame, getCachedFrame]);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center rounded-sm border bg-card p-2">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
