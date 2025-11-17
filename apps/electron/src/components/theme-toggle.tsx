

import { Button } from "./ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <Button
        size="icon"
        variant="ghost"
        className="h-7"
        type="button"
      >
        <Sun className="!size-[1.1rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = theme === "dark" || (theme === "system" && document.documentElement.classList.contains("dark"));

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? (
        <Sun className="!size-[1.1rem]" />
      ) : (
        <Moon className="!size-[1.1rem]" />
      )}
      <span className="sr-only">{isDark ? "Light" : "Dark"}</span>
    </Button>
  );
}
