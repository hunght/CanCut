interface VideoEntry {
  video: HTMLVideoElement;
  ready: boolean;
}

export class VideoCache {
  private idToVideo: Map<string, VideoEntry> = new Map();

  getOrCreateVideo(id: string, src: string): HTMLVideoElement {
    const existing = this.idToVideo.get(id);
    if (existing) return existing.video;
    const video = document.createElement("video");
    const isHttp = /^https?:\/\//i.test(src);
    if (isHttp) {
      video.crossOrigin = "anonymous";
    }
    video.src = src.startsWith("file://") || isHttp ? src : `file://${src}`;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const entry: VideoEntry = { video, ready: false };
    video.addEventListener("loadedmetadata", () => {
      entry.ready = true;
    });
    this.idToVideo.set(id, entry);
    return video;
  }

  async getFrameAt(id: string, src: string, time: number): Promise<HTMLCanvasElement | null> {
    const video = this.getOrCreateVideo(id, src);
    // Ensure metadata is ready
    if (Number.isNaN(video.duration) || video.duration === Infinity) {
      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          video.removeEventListener("loadedmetadata", onLoaded);
          resolve();
        };
        video.addEventListener("loadedmetadata", onLoaded);
      });
    }

    const targetTime = Math.max(0, Math.min(video.duration || time, time));
    if (Math.abs((video.currentTime || 0) - targetTime) > 0.01) {
      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error("Failed to seek video"));
        };
        const cleanup = () => {
          video.removeEventListener("seeked", onSeeked);
          video.removeEventListener("error", onError);
        };
        video.addEventListener("seeked", onSeeked);
        video.addEventListener("error", onError);
        try {
          video.currentTime = targetTime;
        } catch {
          cleanup();
          resolve(); // best-effort
        }
      }).catch(() => {});
    }

    const w = Math.max(1, video.videoWidth || 1);
    const h = Math.max(1, video.videoHeight || 1);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    try {
      ctx.drawImage(video, 0, 0, w, h);
      return canvas;
    } catch {
      return null;
    }
  }
}

export const videoCache = new VideoCache();


