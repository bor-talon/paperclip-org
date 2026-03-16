import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";
import type { OrgNode } from "../../api/agents";
import type { Agent } from "@paperclipai/shared";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

interface FlatNode {
  id: string;
  name: string;
  role: string;
  status: string;
  parentId: string | null;
}

function flattenTree(nodes: OrgNode[], parentId: string | null = null): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name,
      role: node.role,
      status: node.status,
      parentId,
    });
    result.push(...flattenTree(node.reports, node.id));
  }
  return result;
}

function inferTier(depth: number): string {
  if (depth === 0) return "oversight";
  if (depth === 1) return "senior";
  return "junior";
}

function computeDepths(nodes: OrgNode[], depth: number = 0): Map<string, number> {
  const map = new Map<string, number>();
  for (const node of nodes) {
    map.set(node.id, depth);
    const childDepths = computeDepths(node.reports, depth + 1);
    for (const [k, v] of childDepths) map.set(k, v);
  }
  return map;
}

export interface OrgFlowLayout {
  nodes: Node[];
  edges: Edge[];
}

export function buildOrgFlowLayout(
  orgTree: OrgNode[],
  agentMap: Map<string, Agent>,
  savedPositions: Record<string, { x: number; y: number }>,
): OrgFlowLayout {
  const flat = flattenTree(orgTree);
  const depths = computeDepths(orgTree);

  // Dagre layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 48,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  for (const n of flat) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edges: Edge[] = [];
  for (const n of flat) {
    if (n.parentId) {
      g.setEdge(n.parentId, n.id);
      edges.push({
        id: `${n.parentId}->${n.id}`,
        source: n.parentId,
        target: n.id,
        type: "smoothstep",
        style: { stroke: "var(--border)", strokeWidth: 1.5 },
      });
    }
  }

  dagre.layout(g);

  const nodes: Node[] = flat.map((n) => {
    const pos = g.node(n.id);
    const agent = agentMap.get(n.id);
    const depth = depths.get(n.id) ?? 0;
    const savedPos = savedPositions[n.id];

    // Load avatar from agent metadata
    const agentMeta = (agent?.metadata ?? {}) as Record<string, unknown>;
    const avatar = (agentMeta.avatarUrl as string) ?? null;

    return {
      id: n.id,
      type: "agentCard",
      position: savedPos ?? {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      data: {
        name: n.name,
        role: n.role,
        status: n.status,
        title: agent?.title ?? null,
        icon: agent?.icon ?? null,
        adapterType: agent?.adapterType ?? "process",
        tier: inferTier(depth),
        avatar,
        capabilities: agent?.capabilities ?? null,
      },
    };
  });

  return { nodes, edges };
}
