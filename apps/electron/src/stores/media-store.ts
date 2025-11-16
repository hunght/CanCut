import { create } from "zustand";
import { trpcClient } from "@/utils/trpc";

export type MediaType = "image" | "video" | "audio";

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  filePath: string;
  ephemeral?: boolean;
}

interface MediaStore {
  mediaFiles: MediaFile[];
  isLoading: boolean;
  addMediaFile: (projectId: string, file: Omit<MediaFile, "id">) => Promise<void>;
  removeMediaFile: (projectId: string, id: string) => Promise<void>;
  loadProjectMedia: (projectId: string) => Promise<void>;
  clearProjectMedia: (projectId: string) => Promise<void>;
  clearAllMedia: () => void;
}

export const getFileType = (file: File): MediaType | null => {
  const { type } = file;
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return null;
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.remove();
    });
    img.addEventListener("error", () => {
      reject(new Error("Could not load image"));
      img.remove();
    });
    img.src = URL.createObjectURL(file);
  });
};

export const getMediaDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const element = document.createElement(
      file.type.startsWith("video/") ? "video" : "audio"
    ) as HTMLVideoElement;
    element.addEventListener("loadedmetadata", () => {
      resolve(element.duration);
      element.remove();
    });
    element.addEventListener("error", () => {
      reject(new Error("Could not load media"));
      element.remove();
    });
    element.src = URL.createObjectURL(file);
    element.load();
  });
};

export const generateVideoThumbnail = (
  file: File
): Promise<{ thumbnailUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.addEventListener("loadedmetadata", () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = Math.min(1, video.duration * 0.1);
    });

    video.addEventListener("seeked", () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve({
        thumbnailUrl,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      video.remove();
      canvas.remove();
    });

    video.addEventListener("error", () => {
      reject(new Error("Could not load video"));
      video.remove();
      canvas.remove();
    });

    video.src = URL.createObjectURL(file);
    video.load();
  });
};

export const useMediaStore = create<MediaStore>((set, get) => ({
  mediaFiles: [],
  isLoading: false,

  addMediaFile: async (projectId, fileData) => {
    const newItem: MediaFile = {
      ...fileData,
      id: crypto.randomUUID(),
    };

    // Add to local state immediately
    set((state) => ({ mediaFiles: [...state.mediaFiles, newItem] }));

    // Save to SQLite via tRPC
    try {
      await trpcClient.editor.media.add.mutate({
        projectId,
        id: newItem.id,
        name: newItem.name,
        type: newItem.type,
        filePath: newItem.filePath,
        width: newItem.width !== undefined ? Math.round(newItem.width) : undefined,
        height: newItem.height !== undefined ? Math.round(newItem.height) : undefined,
        // API expects integer; duration from metadata can be float seconds
        duration: newItem.duration !== undefined ? Math.round(newItem.duration) : undefined,
        size: newItem.size,
        ephemeral: newItem.ephemeral,
      });
    } catch (error) {
      console.error("Failed to save media item:", error);
      set((state) => ({
        mediaFiles: state.mediaFiles.filter((m) => m.id !== newItem.id),
      }));
    }
  },

  removeMediaFile: async (projectId, id) => {
    const item = get().mediaFiles.find((m) => m.id === id);
    if (item?.url) URL.revokeObjectURL(item.url);
    if (item?.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);

    set((state) => ({
      mediaFiles: state.mediaFiles.filter((m) => m.id !== id),
    }));

    try {
      await trpcClient.editor.media.remove.mutate({ id });
    } catch (error) {
      console.error("Failed to delete media item:", error);
    }
  },

  loadProjectMedia: async (projectId) => {
    set({ isLoading: true });
    try {
      const mediaItems = await trpcClient.editor.media.listForProject.query({
        projectId,
      });

      const mapped: MediaFile[] = mediaItems.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as MediaType,
        filePath: item.filePath,
        url: `file://${item.filePath}`,
        width: item.width ?? undefined,
        height: item.height ?? undefined,
        duration: item.duration ?? undefined,
        size: item.size ?? undefined,
        ephemeral: !!item.ephemeral,
      }));

      set({ mediaFiles: mapped });
    } catch (error) {
      console.error("Failed to load media items:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearProjectMedia: async (projectId) => {
    get().mediaFiles.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
      if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
    });

    set({ mediaFiles: [] });

    try {
      await trpcClient.editor.media.removeAllForProject.mutate({ projectId });
    } catch (error) {
      console.error("Failed to clear media items:", error);
    }
  },

  clearAllMedia: () => {
    get().mediaFiles.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
      if (item.thumbnailUrl) URL.revokeObjectURL(item.thumbnailUrl);
    });
    set({ mediaFiles: [] });
  },
}));
