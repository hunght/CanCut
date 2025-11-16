import { useMemo, useRef, useState, useCallback } from "react";
import { useTimelineStore } from "@/stores/timeline-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Play, Pause, SkipBack } from "lucide-react";

const BASE_PIXELS_PER_SECOND = 80;
const TRACK_HEIGHT = 54;

export function Timeline() {
  const { tracks, getTotalDuration } = useTimelineStore();
  const { currentTime, seek, isPlaying, toggle } = usePlaybackStore();
  const [zoomLevel, setZoomLevel] = useState(1);

  const PIXELS_PER_SECOND = BASE_PIXELS_PER_SECOND * zoomLevel;
  const totalDuration = getTotalDuration();
  const widthPx = useMemo(
    () => Math.max(1200, Math.ceil(totalDuration * PIXELS_PER_SECOND) + 400),
    [totalDuration, PIXELS_PER_SECOND]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(4, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.25, +(z - 0.25).toFixed(2)));

  const handleSeekByClientX = useCallback(
    (clientX: number) => {
      const container = tracksContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, clientX - rect.left + container.scrollLeft);
      const time = x / PIXELS_PER_SECOND;
      seek(time);
    },
    [seek, PIXELS_PER_SECOND]
  );

  return (
    <div className="flex h-full w-full flex-col rounded-sm border bg-card overflow-hidden">
      <div className="border-b p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Timeline</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => seek(0)}
              aria-label="Go to start"
              title="Go to start"
            >
              <SkipBack className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="default"
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <Button type="button" size="icon" variant="ghost" onClick={handleZoomOut} aria-label="Zoom out" title="Zoom out">
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-xs tabular-nums w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
            <Button type="button" size="icon" variant="ghost" onClick={handleZoomIn} aria-label="Zoom in" title="Zoom in">
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Track labels */}
        <div className="w-44 shrink-0 border-r bg-muted/30">
          {tracks.map((t) => (
            <div
              key={t.id}
              className="flex h-[54px] items-center justify-between px-3 border-b"
            >
              <span className="text-xs font-medium truncate">{t.name}</span>
              {t.muted ? (
                <span className="text-[10px] text-muted-foreground">muted</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Tracks area */}
        <div
          className="flex-1 overflow-auto"
          ref={(el) => {
            scrollRef.current = el;
            tracksContainerRef.current = el as HTMLDivElement | null;
          }}
          onClick={(e) => handleSeekByClientX(e.clientX)}
        >
          <div
            className="relative"
            style={{
              width: `${widthPx}px`,
            }}
          >
            {/* Simple ruler */}
            <div className="sticky top-0 z-10 h-6 bg-muted/20 border-b">
              <Ruler widthPx={widthPx} pps={PIXELS_PER_SECOND} />
            </div>

            {/* Tracks */}
            <div className="relative">
              {tracks.map((t) => (
                <TrackRow key={t.id} trackId={t.id} pps={PIXELS_PER_SECOND} />
              ))}

              {/* Playhead */}
              <div
                className="pointer-events-none absolute inset-y-6 z-10 border-l border-primary"
                style={{ left: `${currentTime * PIXELS_PER_SECOND}px` }}
              >
                <div className="absolute -top-6 -left-2 h-6 w-4 bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ruler({ widthPx, pps }: { widthPx: number; pps: number }) {
  const ticks: Array<{ left: number; label?: string }> = [];
  const seconds = Math.ceil(widthPx / pps);
  for (let s = 0; s <= seconds; s++) {
    const left = s * pps;
    const label = `${s}s`;
    ticks.push({ left, label });
    // minor ticks
    for (let i = 1; i < 4; i++) {
      const minorLeft = left + (i * pps) / 4;
      if (minorLeft < (s + 1) * pps) {
        ticks.push({ left: minorLeft });
      }
    }
  }

  return (
    <div className="relative h-full">
      {ticks.map((t, idx) => (
        <div
          key={idx}
          className="absolute top-0 h-full border-l border-muted-foreground/30"
          style={{ left: `${t.left}px` }}
        >
          {t.label ? (
            <span className="absolute -top-0.5 left-1 text-[10px] text-muted-foreground">
              {t.label}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TrackRow({ trackId, pps }: { trackId: string; pps: number }) {
  const track = useTimelineStore((s) => s.tracks.find((t) => t.id === trackId));
  if (!track) return null;

  return (
    <div
      className="relative border-b"
      style={{ height: `${TRACK_HEIGHT}px` }}
    >
      {track.elements.map((el) => {
        const left = (el.startTime - el.trimStart) * pps;
        const width =
          Math.max(0, el.duration - el.trimStart - el.trimEnd) *
          pps;
        return (
          <div
            key={el.id}
            className="absolute top-1 h-[42px] rounded-sm bg-primary/20 border border-primary/40 hover:bg-primary/25 transition-colors"
            style={{ left: `${left}px`, width: `${width}px` }}
            title={`${el.name}`}
          >
            <div className="h-full w-full px-2 flex items-center">
              <span className="text-xs truncate">{el.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
