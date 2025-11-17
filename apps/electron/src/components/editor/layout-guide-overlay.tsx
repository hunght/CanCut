

import { useEditorStore } from "@/stores/editor-store";

function TikTokGuide() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <img
        src="/platform-guides/tiktok-blueprint.png"
        alt="TikTok layout guide"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />
    </div>
  );
}

export function LayoutGuideOverlay() {
  const { layoutGuide } = useEditorStore();

  if (layoutGuide.platform === null) return null;
  if (layoutGuide.platform === "tiktok") return <TikTokGuide />;

  return null;
}
