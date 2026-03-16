import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Agent } from '../../types';
import { TIER_COLORS } from '../../constants';

interface AgentNodeData {
  label: string;
  agent: Agent;
}

export function AgentNode({ data }: NodeProps) {
  const { agent } = data as unknown as AgentNodeData;

  return (
    <div
      className="px-3 py-2 rounded-lg bg-white shadow-sm min-w-[180px]"
      style={{
        border: `2px solid ${TIER_COLORS[agent.tier]}`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
          {agent.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {agent.name}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {agent.role}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
