import type { Node, Edge } from "@xyflow/react";

export type AgentTier = "oversight" | "senior" | "junior";

export interface AgentNodeData {
  agentId: string;
  name: string;
  role: string;
  title: string | null;
  status: string;
  icon: string | null;
  adapterType: string;
  tier: AgentTier;
  podId: string | null;
  podName: string | null;
  avatar: string | null;
  lastHeartbeatAt: Date | null;
  [key: string]: unknown;
}

export interface PodGroupData {
  label: string;
  podId: string;
  [key: string]: unknown;
}

export type AgentFlowNode = Node<AgentNodeData, "agent">;
export type PodGroupNode = Node<PodGroupData, "podGroup">;
export type OrgFlowNode = AgentFlowNode | PodGroupNode;
export type OrgFlowEdge = Edge;

export interface AgentFile {
  name: string;
  content: string;
}

export interface OrgChartPositions {
  [nodeId: string]: { x: number; y: number };
}

export const AGENT_FILES = [
  "AGENTS.md",
  "SOUL.md",
  "IDENTITY.md",
  "USER.md",
  "MEMORY.md",
  "TOOLS.md",
] as const;

export type AgentFileName = (typeof AGENT_FILES)[number];
