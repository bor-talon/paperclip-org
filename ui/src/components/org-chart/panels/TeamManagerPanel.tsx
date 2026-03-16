import { useState } from "react";
import { X, Eye, EyeOff, Pencil, Check } from "lucide-react";

interface TeamEntry {
  managerId: string;
  label: string;
  color: string;
}

interface TeamManagerPanelProps {
  teams: TeamEntry[];
  hiddenTeams: Set<string>;
  onToggleTeam: (managerId: string) => void;
  onRenameTeam: (managerId: string, newName: string) => void;
  onClose: () => void;
}

export type { TeamEntry };

export function TeamManagerPanel({
  teams,
  hiddenTeams,
  onToggleTeam,
  onRenameTeam,
  onClose,
}: TeamManagerPanelProps) {
  return (
    <div className="absolute top-12 right-12 z-50 w-[300px] bg-card border border-border shadow-lg rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Manage Teams</h3>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {teams.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">No teams found</p>
        ) : (
          <div className="py-1">
            {teams.map((team) => (
              <TeamRow
                key={team.managerId}
                team={team}
                hidden={hiddenTeams.has(team.managerId)}
                onToggle={() => onToggleTeam(team.managerId)}
                onRename={(name) => onRenameTeam(team.managerId, name)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          {hiddenTeams.size} hidden · {teams.length - hiddenTeams.size} visible
        </p>
      </div>
    </div>
  );
}

function TeamRow({
  team,
  hidden,
  onToggle,
  onRename,
}: {
  team: TeamEntry;
  hidden: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(team.label);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== team.label) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 hover:bg-accent/30 transition-colors ${hidden ? "opacity-50" : ""}`}>
      {/* Color dot */}
      <span
        className="w-3 h-3 rounded shrink-0"
        style={{ backgroundColor: team.color }}
      />

      {/* Name / edit */}
      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            className="flex-1 bg-muted border border-border px-1.5 py-0.5 text-xs rounded focus:outline-none focus:ring-1 focus:ring-foreground/20"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            autoFocus
          />
          <button onClick={handleSave} className="p-0.5 hover:bg-accent rounded">
            <Check className="h-3 w-3 text-green-500" />
          </button>
        </div>
      ) : (
        <span className="flex-1 text-xs truncate">{team.label}</span>
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => { setEditValue(team.label); setEditing(true); }}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="Rename"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-accent rounded transition-colors"
            title={hidden ? "Show" : "Hide"}
          >
            {hidden ? (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Eye className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
