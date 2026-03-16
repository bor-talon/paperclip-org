import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { AgentNodeData } from "../types";
import { StatusDot } from "../StatusDot";
import { AgentAvatar } from "../AgentAvatar";
import { ADAPTER_LABELS } from "../constants";
import { AGENT_ROLE_LABELS } from "@paperclipai/shared";

const roleLabels = AGENT_ROLE_LABELS as Record<string, string>;

interface AgentNodeComponentProps {
  data: AgentNodeData;
  selected?: boolean;
}

function AgentNodeComponent({ data, selected }: AgentNodeComponentProps) {
  const roleText = data.title ?? roleLabels[data.role] ?? data.role;
  const adapterText = ADAPTER_LABELS[data.adapterType] ?? data.adapterType;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-border !border-0" />
      <div
        className={`
          bg-card border border-border px-3 py-2.5 w-[220px] cursor-pointer
          transition-all duration-150 select-none
          hover:border-foreground/20 hover:shadow-sm
          ${selected ? "border-foreground/40 shadow-md ring-1 ring-foreground/10" : ""}
        `}
      >
        <div className="flex items-center gap-2.5">
          <AgentAvatar icon={data.icon} avatar={data.avatar} name={data.name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground truncate">
                {data.name}
              </span>
              <StatusDot status={data.status} />
            </div>
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              {roleText}
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono leading-tight mt-0.5">
              {adapterText}
            </p>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-border !border-0" />
    </>
  );
}

export const AgentNode = memo(AgentNodeComponent);
