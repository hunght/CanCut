import { create } from "zustand";
// TODO: Replace with Electron-specific storage and utils
// import { storageService } from "@/lib/storage/storage-service";
// import { useTimelineStore } from "./timeline-store";
// import { generateUUID } from "@/lib/utils";
// import { MediaType, MediaFile } from "@/types/media";
// import { videoCache } from "@/lib/video-cache";

interface MediaFile {
  id: string;
  url?: string;
  thumbnailUrl?: string;
  type: string;
  width?: number;
  height?: number;
  file?: File;
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

export const useMediaStore = create<MediaStore>((set, get) => ({
  mediaFiles: [],
  isLoading: false,
  addMediaFile: async (projectId, file) => {
    // TODO: Implement Electron file handling and SQLite persistence
    const newItem: MediaFile = {
      ...file,
      id: crypto.randomUUID(),
    };
    set((state) => ({ mediaFiles: [...state.mediaFiles, newItem] }));
    // TODO: Save to SQLite
  },
  removeMediaFile: async (projectId, id) => {
    set((state) => ({ mediaFiles: state.mediaFiles.filter((media) => media.id !== id) }));
    // TODO: Remove from SQLite
  },
  loadProjectMedia: async (projectId) => {
    set({ isLoading: true });
    // TODO: Load from SQLite
    set({ isLoading: false });
  },
  clearProjectMedia: async (projectId) => {
    set({ mediaFiles: [] });
    // TODO: Remove all project media from SQLite
  },
  clearAllMedia: () => {
    set({ mediaFiles: [] });
    // TODO: Remove all media from SQLite
  },
}));
