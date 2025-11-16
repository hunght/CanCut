import { create } from "zustand";
import { persist } from "zustand/middleware";
// TODO: Replace with local types if needed
// import { ActionWithOptionalArgs } from "@/constants/actions";
// import { isAppleDevice, isDOMElement, isTypableElement } from "@/lib/utils";
// import { KeybindingConfig, ShortcutKey } from "@/types/keybinding";

export const defaultKeybindings = {
  space: "toggle-play",
  j: "seek-backward",
  k: "toggle-play",
  l: "seek-forward",
  left: "frame-step-backward",
  right: "frame-step-forward",
  "shift+left": "jump-backward",
  "shift+right": "jump-forward",
  home: "goto-start",
  enter: "goto-start",
  end: "goto-end",
  s: "split-element",
  n: "toggle-snapping",
  "ctrl+a": "select-all",
  "ctrl+d": "duplicate-selected",
  "ctrl+c": "copy-selected",
  "ctrl+v": "paste-selected",
  "ctrl+z": "undo",
  "ctrl+shift+z": "redo",
  "ctrl+y": "redo",
  delete: "delete-selected",
  backspace: "delete-selected",
};

export interface KeybindingsState {
  keybindings: Record<string, string>;
  isCustomized: boolean;
  keybindingsEnabled: boolean;
  isRecording: boolean;
  updateKeybinding: (key: string, action: string) => void;
  removeKeybinding: (key: string) => void;
  resetToDefaults: () => void;
  importKeybindings: (config: Record<string, string>) => void;
  exportKeybindings: () => Record<string, string>;
  enableKeybindings: () => void;
  disableKeybindings: () => void;
  setIsRecording: (isRecording: boolean) => void;
  getKeybindingString: (ev: KeyboardEvent) => string | null;
}

export const useKeybindingsStore = create<KeybindingsState>()(
  persist(
    (set, get) => ({
      keybindings: { ...defaultKeybindings },
      isCustomized: false,
      keybindingsEnabled: true,
      isRecording: false,
      updateKeybinding: (key, action) => {
        set((state) => {
          const newKeybindings = { ...state.keybindings };
          newKeybindings[key] = action;
          return {
            keybindings: newKeybindings,
            isCustomized: true,
          };
        });
      },
      removeKeybinding: (key) => {
        set((state) => {
          const newKeybindings = { ...state.keybindings };
          delete newKeybindings[key];
          return {
            keybindings: newKeybindings,
            isCustomized: true,
          };
        });
      },
      resetToDefaults: () => {
        set({
          keybindings: { ...defaultKeybindings },
          isCustomized: false,
        });
      },
      enableKeybindings: () => {
        set({ keybindingsEnabled: true });
      },
      disableKeybindings: () => {
        set({ keybindingsEnabled: false });
      },
      importKeybindings: (config) => {
        set({
          keybindings: { ...config },
          isCustomized: true,
        });
      },
      exportKeybindings: () => {
        return get().keybindings;
      },
      setIsRecording: (isRecording) => {
        set({ isRecording });
      },
      getKeybindingString: (ev) => {
        return generateKeybindingString(ev);
      },
    }),
    {
      name: "opencut-keybindings",
      version: 2,
    }
  )
);

function generateKeybindingString(ev: KeyboardEvent): string | null {
  const target = ev.target as HTMLElement;
  const modifierKey = getActiveModifier(ev);
  const key = getPressedKey(ev);
  if (!key) return null;
  if (modifierKey) {
    if (
      modifierKey === "shift" &&
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
    ) {
      return null;
    }
    return `${modifierKey}+${key}`;
  }
  if (
    target &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
  )
    return null;
  return `${key}`;
}

function getPressedKey(ev: KeyboardEvent): string | null {
  const key = (ev.key ?? "").toLowerCase();
  const code = ev.code ?? "";
  if (code === "Space" || key === " " || key === "spacebar" || key === "space") return "space";
  if (key.startsWith("arrow")) {
    return key.slice(5);
  }
  if (key === "tab") return "tab";
  if (key === "home") return "home";
  if (key === "end") return "end";
  if (key === "delete") return "delete";
  if (key === "backspace") return "backspace";
  if (code.startsWith("Key")) {
    const letter = code.slice(3).toLowerCase();
    if (letter.length === 1 && letter >= "a" && letter <= "z") {
      return letter;
    }
  }
  if (code.startsWith("Digit")) {
    const digit = code.slice(5);
    if (digit.length === 1 && digit >= "0" && digit <= "9") {
      return digit;
    }
  }
  const isDigit = key.length === 1 && key >= "0" && key <= "9";
  if (isDigit) return key;
  if (key === "/" || key === "." || key === "enter") return key;
  return null;
}

function getActiveModifier(ev: KeyboardEvent): string | null {
  const modifierKeys = {
    ctrl: navigator.platform.includes("Mac") ? ev.metaKey : ev.ctrlKey,
    alt: ev.altKey,
    shift: ev.shiftKey,
  };
  const activeModifier = Object.keys(modifierKeys)
    .filter((key) => modifierKeys[key as keyof typeof modifierKeys])
    .join("+");
  return activeModifier === "" ? null : activeModifier;
}
