import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize2, Plus, RotateCcw, Map, Eye, EyeOff, Rocket, BoxSelect, GitBranch, Settings2 } from "lucide-react";

export type UndeployedMode = "hide" | "dim" | "show";

interface OrgChartToolbarProps {
  onAddAgent: () => void;
  onResetLayout: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  undeployedMode: UndeployedMode;
  onCycleUndeployedMode: () => void;
  showTeamBoxes: boolean;
  onToggleTeamBoxes: () => void;
  showEdges: boolean;
  onToggleEdges: () => void;
  onOpenTeamManager: () => void;
}

export function OrgChartToolbar({
  onAddAgent,
  onResetLayout,
  showMinimap,
  onToggleMinimap,
  undeployedMode,
  onCycleUndeployedMode,
  showTeamBoxes,
  onToggleTeamBoxes,
  showEdges,
  onToggleEdges,
  onOpenTeamManager,
}: OrgChartToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const modeLabel =
    undeployedMode === "hide" ? "Undeployed: Hidden" :
    undeployedMode === "dim" ? "Undeployed: Dimmed" :
    "Undeployed: Shown";

  const ModeIcon = undeployedMode === "hide" ? EyeOff : undeployedMode === "dim" ? Eye : Rocket;

  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
      <ToolbarButton icon={ZoomIn} onClick={() => zoomIn()} title="Zoom in" />
      <ToolbarButton icon={ZoomOut} onClick={() => zoomOut()} title="Zoom out" />
      <ToolbarButton icon={Maximize2} onClick={() => fitView({ padding: 0.1 })} title="Fit view" />
      <ToolbarButton icon={Map} onClick={onToggleMinimap} title="Toggle minimap" active={showMinimap} />
      <div className="h-px bg-border my-1" />
      <ToolbarButton icon={ModeIcon} onClick={onCycleUndeployedMode} title={modeLabel}
        active={undeployedMode !== "show"} />
      <ToolbarButton icon={BoxSelect} onClick={onToggleTeamBoxes}
        title={showTeamBoxes ? "Hide team boxes" : "Show team boxes"} active={showTeamBoxes} />
      <ToolbarButton icon={GitBranch} onClick={onToggleEdges}
        title={showEdges ? "Hide lines" : "Show lines"} active={showEdges} />
      <ToolbarButton icon={Settings2} onClick={onOpenTeamManager} title="Manage teams" />
      <div className="h-px bg-border my-1" />
      <ToolbarButton icon={Plus} onClick={onAddAgent} title="Add agent" />
      <ToolbarButton icon={RotateCcw} onClick={onResetLayout} title="Reset layout" />
    </div>
  );
}

function ToolbarButton({
  icon: Icon, onClick, title, active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      className={`
        w-8 h-8 flex items-center justify-center
        bg-card border border-border text-muted-foreground
        hover:bg-accent hover:text-foreground transition-colors
        ${active ? "bg-accent text-foreground" : ""}
      `}
      onClick={onClick}
      title={title}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
