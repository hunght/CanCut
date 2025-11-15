import { create } from "zustand";
import { editorStorage } from "@/services/editor-storage";
import { randomUUID } from "node:crypto";

interface TimelineElement {
  id: string;
  type: "media" | "text";
  name: string;
  startTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  mediaId?: string;
  muted?: boolean;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: "media" | "audio" | "text";
  elements: TimelineElement[];
  muted: boolean;
  isMain?: boolean;
}

interface TimelineStore {
  tracks: TimelineTrack[];
  loadProjectTimeline: (projectId: string, sceneId?: string) => Promise<void>;
  saveProjectTimeline: (projectId: string, sceneId?: string) => Promise<void>;
  clearTimeline: () => void;
  addTrack: (type: "media" | "audio" | "text") => string;
  addElementToTrack: (trackId: string, element: Omit<TimelineElement, "id">) => string | null;
  getTotalDuration: () => number;
}

function ensureMainTrack(tracks: TimelineTrack[]): TimelineTrack[] {
  if (!tracks.some((t) => t.isMain)) {
    return [
      {
        id: randomUUID(),
        name: "Main Track",
        type: "media",
        elements: [],
        muted: false,
        isMain: true,
      },
      ...tracks,
    ];
  }
  return tracks;
}

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  tracks: ensureMainTrack([]),

  loadProjectTimeline: async (projectId, sceneId) => {
    try {
      const json = await editorStorage.loadTimeline({ projectId, sceneId });
      if (!json) {
        set({ tracks: ensureMainTrack([]) });
        return;
      }
      const parsed = JSON.parse(json) as TimelineTrack[];
      set({ tracks: ensureMainTrack(parsed) });
    } catch {
      set({ tracks: ensureMainTrack([]) });
    }
  },

  saveProjectTimeline: async (projectId, sceneId) => {
    const { tracks } = get();
    const payload = JSON.stringify(tracks);
    await editorStorage.saveTimeline({ projectId, sceneId, tracksJson: payload });
  },

  clearTimeline: () => set({ tracks: ensureMainTrack([]) }),

  addTrack: (type) => {
    const track: TimelineTrack = {
      id: randomUUID(),
      name: type === "media" ? "Media Track" : type === "audio" ? "Audio Track" : "Text Track",
      type,
      elements: [],
      muted: false,
    };
    set({ tracks: ensureMainTrack([...get().tracks, track]) });
    return track.id;
  },

  addElementToTrack: (trackId, element) => {
    const tracks = get().tracks;
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return null;
    const newEl: TimelineElement = { id: randomUUID(), ...element };
    track.elements.push(newEl);
    set({ tracks: [...tracks] });
    return newEl.id;
  },

  getTotalDuration: () => {
    const { tracks } = get();
    let maxEnd = 0;
    for (const track of tracks) {
      for (const el of track.elements) {
        const end = el.startTime + (el.duration - el.trimStart - el.trimEnd);
        if (end > maxEnd) maxEnd = end;
      }
    }
    return maxEnd;
  },
}));
