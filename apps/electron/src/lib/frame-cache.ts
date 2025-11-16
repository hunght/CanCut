type TimelineHash = string;

interface CachedFrame {
  timelineHash: TimelineHash;
  imageData: ImageData;
}

// Shared cache across HMR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny: any = globalThis as any;
const sharedCache: Map<number, CachedFrame> =
  globalAny.__electronFrameCache ?? new Map<number, CachedFrame>();
globalAny.__electronFrameCache = sharedCache;

export interface FrameCacheAPI {
  getCachedFrame: (key: number, hash: TimelineHash) => ImageData | null;
  cacheFrame: (key: number, hash: TimelineHash, imageData: ImageData) => void;
  invalidateAll: () => void;
}

export function createFrameCache(): FrameCacheAPI {
  const getCachedFrame = (key: number, hash: TimelineHash): ImageData | null => {
    const cached = sharedCache.get(key);
    if (!cached) return null;
    if (cached.timelineHash !== hash) {
      sharedCache.delete(key);
      return null;
    }
    return cached.imageData;
  };

  const cacheFrame = (key: number, hash: TimelineHash, imageData: ImageData) => {
    sharedCache.set(key, { timelineHash: hash, imageData });
  };

  const invalidateAll = () => {
    sharedCache.clear();
  };

  return { getCachedFrame, cacheFrame, invalidateAll };
}


