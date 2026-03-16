import { MiniMap } from "@xyflow/react";

interface OrgChartMinimapProps {
  visible: boolean;
}

export function OrgChartMinimap({ visible }: OrgChartMinimapProps) {
  if (!visible) return null;

  return (
    <MiniMap
      className="!bg-card !border-border"
      maskColor="rgba(0, 0, 0, 0.15)"
      nodeColor="var(--muted)"
      nodeStrokeColor="var(--border)"
      position="bottom-right"
      pannable
      zoomable
    />
  );
}
