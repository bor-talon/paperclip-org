import { useMemo } from "react";
import dagre from "dagre";
import type { OrgNode } from "../../api/agents";
import type { Agent } from "@paperclipai/shared";
import type { AgentNodeData, AgentFlowNode, OrgFlowEdge, AgentTier, OrgChartPositions } from "../../components/org-chart/types";
import { NODE_WIDTH, NODE_HEIGHT } from "../../components/org-chart/constants";

interface LayoutResult {
  nodes: AgentFlowNode[];
  edges: OrgFlowEdge[];
}

function inferTier(depth: number): AgentTier {
  if (depth === 0) return "oversight";
  if (depth === 1) return "senior";
  return "junior";
}

function flattenOrgTree(
  nodes: OrgNode[],
  agentMap: Map<string, Agent>,
  depth: number,
  parentId: string | null,
  result: { nodes: AgentFlowNode[]; edges: OrgFlowEdge[] },
): void {
  for (const node of nodes) {
    const agent = agentMap.get(node.id);
    const tier = inferTier(depth);

    const flowNode: AgentFlowNode = {
      id: node.id,
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        agentId: node.id,
        name: node.name,
        role: node.role,
        title: agent?.title ?? null,
        status: node.status,
        icon: agent?.icon ?? null,
        adapterType: agent?.adapterType ?? "process",
        tier,
        podId: null,
        podName: null,
        avatar: (agent?.metadata as Record<string, string> | null)?.avatar ?? null,
        lastHeartbeatAt: agent?.lastHeartbeatAt ?? null,
      },
    };
    result.nodes.push(flowNode);

    if (parentId) {
      result.edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: "smoothstep",
        style: { strokeWidth: 1.5 },
      });
    }

    if (node.reports.length > 0) {
      flattenOrgTree(node.reports, agentMap, depth + 1, node.id, result);
    }
  }
}

function applyDagreLayout(nodes: AgentFlowNode[], edges: OrgFlowEdge[]): AgentFlowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 60,
    ranksep: 100,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function applySavedPositions(
  nodes: AgentFlowNode[],
  saved: OrgChartPositions,
): AgentFlowNode[] {
  return nodes.map((node) => {
    const pos = saved[node.id];
    if (pos) {
      return { ...node, position: { x: pos.x, y: pos.y } };
    }
    return node;
  });
}

export function useOrgLayout(
  orgTree: OrgNode[] | undefined,
  agents: Agent[] | undefined,
  savedPositions: OrgChartPositions,
): LayoutResult {
  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    for (const a of agents ?? []) m.set(a.id, a);
    return m;
  }, [agents]);

  return useMemo(() => {
    if (!orgTree || orgTree.length === 0) {
      return { nodes: [], edges: [] };
    }

    const result: LayoutResult = { nodes: [], edges: [] };
    flattenOrgTree(orgTree, agentMap, 0, null, result);

    // Apply dagre layout first, then override with saved positions
    const layoutNodes = applyDagreLayout(result.nodes, result.edges);
    const finalNodes = applySavedPositions(layoutNodes, savedPositions);

    return { nodes: finalNodes, edges: result.edges };
  }, [orgTree, agentMap, savedPositions]);
}
