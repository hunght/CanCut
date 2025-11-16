import { create } from "zustand";
import { persist } from "zustand/middleware";
// TODO: Replace with local types if needed
// import { CanvasPreset } from "@/types/editor";

export type PlatformLayout = "tiktok";

export const PLATFORM_LAYOUTS: Record<PlatformLayout, string> = {
  tiktok: "TikTok",
};

interface LayoutGuideSettings {
  platform: PlatformLayout | null;
}

interface CanvasPreset {
  name: string;
  width: number;
  height: number;
}

interface EditorState {
  isInitializing: boolean;
  isPanelsReady: boolean;
  canvasPresets: CanvasPreset[];
  layoutGuide: LayoutGuideSettings;
  setInitializing: (loading: boolean) => void;
  setPanelsReady: (ready: boolean) => void;
  initializeApp: () => Promise<void>;
  setLayoutGuide: (settings: Partial<LayoutGuideSettings>) => void;
  toggleLayoutGuide: (platform: PlatformLayout) => void;
}

const DEFAULT_CANVAS_PRESETS: CanvasPreset[] = [
  { name: "16:9", width: 1920, height: 1080 },
  { name: "9:16", width: 1080, height: 1920 },
  { name: "1:1", width: 1080, height: 1080 },
  { name: "4:3", width: 1440, height: 1080 },
];

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      isInitializing: true,
      isPanelsReady: false,
      canvasPresets: DEFAULT_CANVAS_PRESETS,
      layoutGuide: {
        platform: null,
      },
      setInitializing: (loading) => {
        set({ isInitializing: loading });
      },
      setPanelsReady: (ready) => {
        set({ isPanelsReady: ready });
      },
      initializeApp: async () => {
        set({ isInitializing: true, isPanelsReady: false });
        set({ isPanelsReady: true, isInitializing: false });
      },
      setLayoutGuide: (settings) => {
        set((state) => ({
          layoutGuide: {
            ...state.layoutGuide,
            ...settings,
          },
        }));
      },
      toggleLayoutGuide: (platform) => {
        set((state) => ({
          layoutGuide: {
            platform: state.layoutGuide.platform === platform ? null : platform,
          },
        }));
      },
    }),
    {
      name: "editor-settings",
      partialize: (state) => ({
        layoutGuide: state.layoutGuide,
      }),
    }
  )
);
