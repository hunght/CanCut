import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        <DragWindowRegion title="CanCut" />
        <main className="flex-1 overflow-hidden bg-background">{children}</main>
      </div>
    </SidebarProvider>
  );
}
