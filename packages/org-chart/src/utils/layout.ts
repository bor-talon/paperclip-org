import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Agent } from '../types';
import { TIER_COLORS } from '../constants';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

export const getLayoutedElements = (
  agents: Agent[],
  _edges: Edge[]
): { nodes: Node[]; edges: Edge[] } => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const tierOrder: Record<string, number> = {
    oversight: 0,
    senior: 1,
    junior: 2,
  };

  // Sort agents by tier
  const sortedAgents = [...agents].sort(
    (a, b) => tierOrder[a.tier] - tierOrder[b.tier]
  );

  // Build hierarchy based on tier
  const nodesByTier: Record<string, Agent[]> = {
    oversight: [],
    senior: [],
    junior: [],
  };

  sortedAgents.forEach((agent) => {
    nodesByTier[agent.tier].push(agent);
  });

  // Create nodes with positions
  const nodes: Node[] = sortedAgents.map((agent) => {
    const tier = agent.tier;
    const tierIndex = nodesByTier[tier]!.findIndex((a) => a.id === agent.id);
    const x = tierIndex * (NODE_WIDTH + 50) + 50;
    const y = (tierOrder[tier] ?? 0) * (NODE_HEIGHT + 100) + 50;

    return {
      id: agent.id,
      position: { x, y },
      data: { label: agent.name, agent },
      type: 'agentNode',
      style: {
        background: '#fff',
        border: `2px solid ${TIER_COLORS[agent.tier]}`,
        borderRadius: '8px',
        padding: '8px',
        width: NODE_WIDTH,
      },
    };
  });

  // Create edges between senior -> junior (reporting relationships)
  const layoutEdges: Edge[] = [];
  
  // Simple logic: oversight connects to seniors, seniors to juniors
  const seniors = agents.filter((a) => a.tier === 'senior');
  const juniors = agents.filter((a) => a.tier === 'junior');
  
  seniors.forEach((senior, si) => {
    // Connect oversight to seniors
    const oversight = agents.find((a) => a.tier === 'oversight');
    if (oversight) {
      layoutEdges.push({
        id: `e-${oversight.id}-${senior.id}`,
        source: oversight.id,
        target: senior.id,
        type: 'straight',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });
    }
    
    // Connect seniors to juniors (distribute)
    juniors.forEach((junior, ji) => {
      if (ji % seniors.length === si) {
        layoutEdges.push({
          id: `e-${senior.id}-${junior.id}`,
          source: senior.id,
          target: junior.id,
          type: 'straight',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
      }
    });
  });

  return { nodes, edges: layoutEdges };
};

export const exportToJson = (agents: Agent[], edges: Edge[]) => {
  const data = {
    agents,
    edges,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'org-chart.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const importFromJson = (file: File): Promise<{ agents: Agent[]; edges: Edge[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
