import React from "react";
import { Toaster } from "@/components/ui/toaster";

// Note: BaseLayout components (AppSidebar, AppRightSidebar, DragWindowRegion, HeaderNav)
// are web-specific and not available in Electron. This layout may not be used.
// If needed, create Electron-specific versions or use EditorLayout instead.
export default function BaseLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex h-screen flex-col">
      <main className="flex-1 overflow-auto bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
