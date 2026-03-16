import { useCallback, useEffect, useRef } from "react";
import { Edit3, Trash2, EyeOff, Eye } from "lucide-react";

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
  isTeam?: boolean;
}

interface OrgChartContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onToggleTeam?: (managerId: string) => void;
  isTeamHidden?: (managerId: string) => boolean;
}

export type { ContextMenuState };

export function OrgChartContextMenu({
  menu,
  onClose,
  onEdit,
  onDelete,
  onToggleTeam,
  isTeamHidden,
}: OrgChartContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const hidden = isTeamHidden?.(menu.nodeId) ?? false;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-card border border-border shadow-lg py-1 min-w-[160px]"
      style={{ left: menu.x, top: menu.y }}
    >
      <p className="px-3 py-1.5 text-[11px] text-muted-foreground font-medium border-b border-border mb-1 truncate">
        {menu.nodeName}
      </p>
      {menu.isTeam ? (
        <>
          <MenuItem
            icon={hidden ? Eye : EyeOff}
            label={hidden ? "Show team box" : "Hide team box"}
            onClick={() => {
              onToggleTeam?.(menu.nodeId);
              onClose();
            }}
          />
          <MenuItem
            icon={Edit3}
            label="Edit manager"
            onClick={() => {
              onEdit(menu.nodeId);
              onClose();
            }}
          />
        </>
      ) : (
        <>
          <MenuItem
            icon={Edit3}
            label="Edit details"
            onClick={() => {
              onEdit(menu.nodeId);
              onClose();
            }}
          />
          <MenuItem
            icon={Trash2}
            label="Remove agent"
            onClick={() => {
              onDelete(menu.nodeId);
              onClose();
            }}
            destructive
          />
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left
        transition-colors hover:bg-accent/50
        ${destructive ? "text-red-500 hover:text-red-600" : "text-foreground"}
      `}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
