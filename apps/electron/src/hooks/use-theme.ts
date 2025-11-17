import { useEffect, useState } from "react";
import { getCurrentTheme, setTheme } from "@/helpers/theme_helpers";
import type { ThemeMode } from "@/lib/types/theme-mode";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getCurrentTheme().then(({ local, system }) => {
      setThemeState(local || system);
    });

    // Listen for theme changes from the document
    const observer = new MutationObserver(() => {
      getCurrentTheme().then(({ local, system }) => {
        setThemeState(local || system);
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const updateTheme = async (newTheme: ThemeMode) => {
    await setTheme(newTheme);
    setThemeState(newTheme);
  };

  return {
    theme,
    setTheme: updateTheme,
    mounted,
  };
}

