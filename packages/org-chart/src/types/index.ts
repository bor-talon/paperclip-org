export type AgentTier = 'oversight' | 'senior' | 'junior';

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  skills: string[];
  tier: AgentTier;
  podId?: string;
  files: AgentFile[];
}

export interface AgentFile {
  name: string;
  content: string;
}

export interface Pod {
  id: string;
  name: string;
  description: string;
  agents: string[];
}

export interface OrgChart {
  nodes: Agent[];
  edges: OrgEdge[];
  pods: Pod[];
  viewport: Viewport;
}

export interface OrgEdge {
  id: string;
  source: string;
  target: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
