import { create } from "zustand";
import { useTimelineStore } from "./timeline-store";

interface PlaybackStore {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  previousVolume: number;
  speed: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  previousVolume: 1,
  speed: 1.0,
  play: () => {
    if (get().isPlaying) return;
    set({ isPlaying: true });
    let last = performance.now();
    const loop = () => {
      if (!get().isPlaying) return;
      const now = performance.now();
      const deltaMs = now - last;
      last = now;
      const deltaSeconds = (deltaMs / 1000) * get().speed;

      const duration = useTimelineStore.getState().getTotalDuration();
      const next = get().currentTime + deltaSeconds;
      if (next >= duration && duration > 0) {
        set({ currentTime: duration, isPlaying: false });
        return;
      }
      set({ currentTime: next, duration });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  pause: () => {
    if (!get().isPlaying) return;
    set({ isPlaying: false });
  },
  toggle: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },
  seek: (time: number) => {
    const duration = useTimelineStore.getState().getTotalDuration();
    const clampedTime = Math.max(0, Math.min(duration || 0, time));
    set({ currentTime: clampedTime });
    // TODO: Dispatch playback event for Electron
  },
  setVolume: (volume: number) =>
    set((state) => ({
      volume: Math.max(0, Math.min(1, volume)),
      muted: volume === 0,
      previousVolume: volume > 0 ? volume : state.previousVolume,
    })),
  setSpeed: (speed: number) => {
    const newSpeed = Math.max(0.1, Math.min(2.0, speed));
    set({ speed: newSpeed });
    // TODO: Dispatch speed event for Electron
  },
  setDuration: (duration: number) => set({ duration }),
  setCurrentTime: (time: number) => set({ currentTime: time }),
  mute: () => {
    const { volume, previousVolume } = get();
    set({
      muted: true,
      previousVolume: volume > 0 ? volume : previousVolume,
      volume: 0,
    });
  },
  unmute: () => {
    const { previousVolume } = get();
    set({ muted: false, volume: previousVolume ?? 1 });
  },
  toggleMute: () => {
    const { muted } = get();
    if (muted) {
      get().unmute();
    } else {
      get().mute();
    }
  },
}));
