/**
 * OrgChart — Compact hybrid layout:
 * Leaf teams: manager on left, members stacked vertically (max 8) to the right.
 * Branch teams: manager on top, sub-team boxes stacked vertically below.
 * Lines never overlap because each team is a self-contained block.
 */
import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import { Network } from "lucide-react";
import { agentsApi, type OrgNode } from "../api/agents";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useDialog } from "../context/DialogContext";
import { queryKeys } from "../lib/queryKeys";
import { EmptyState } from "../components/EmptyState";
import { PageSkeleton } from "../components/PageSkeleton";
import { AgentCardNode } from "../components/org-chart/nodes/AgentCardNode";
import { TeamGroupNode } from "../components/org-chart/nodes/TeamGroupNode";
import { AgentDetailPanel } from "../components/org-chart/panels/AgentDetailPanel";
import {
  OrgChartContextMenu,
  type ContextMenuState,
} from "../components/org-chart/OrgChartContextMenu";
import { OrgChartToolbar } from "../components/org-chart/OrgChartToolbar";
import { useOrgPositions } from "../hooks/org-chart/useOrgPositions";
import { useAgentFiles } from "../hooks/org-chart/useAgentFiles";
import { useDeployState } from "../hooks/org-chart/useDeployState";
import { TeamManagerPanel, type TeamEntry } from "../components/org-chart/panels/TeamManagerPanel";
import type { UndeployedMode } from "../components/org-chart/OrgChartToolbar";
import type { Agent } from "@paperclipai/shared";
import { EditableEdge } from "../components/org-chart/edges/EditableEdge";
import "@xyflow/react/dist/style.css";

const CW = 190;  // card width
const CH = 64;   // card height
const GAP = 8;   // gap between stacked members
const MGR_GAP = 16; // gap between manager and member stack
const PAD = 14;  // group box padding
const PAD_TOP = 28; // group box top padding (for label)
const TEAM_STACK_GAP = 12; // vertical gap between stacked team boxes
const SECTION_GAP = 30; // gap between major sections/columns

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = { agentCard: AgentCardNode, teamGroup: TeamGroupNode };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: Record<string, any> = { editable: EditableEdge };

const COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#ec4899","#06b6d4","#f97316","#14b8a6","#6366f1",
  "#84cc16","#a855f7",
];
let gColorIdx = 0;
function nextColor(): string { return COLORS[gColorIdx++ % COLORS.length]; }

// ── Block measurement & placement ───────────────────────────────────────────

interface Block {
  node: OrgNode;
  leaves: OrgNode[];
  subBlocks: Block[];
  color: string;
  w: number;
  h: number;
}

function buildBlock(node: OrgNode): Block {
  const leaves: OrgNode[] = [];
  const subBlocks: Block[] = [];
  for (const c of node.reports) {
    if (c.reports.length > 0) subBlocks.push(buildBlock(c));
    else leaves.push(c);
  }
  const block: Block = { node, leaves, subBlocks, color: nextColor(), w: 0, h: 0 };
  measure(block);
  return block;
}

function measure(b: Block): void {
  const isLeaf = b.subBlocks.length === 0;

  if (isLeaf) {
    // Leaf team: manager LEFT, members stacked RIGHT (max 8 per column)
    const cols = Math.ceil(b.leaves.length / 8);
    const colItems = Math.min(b.leaves.length, 8);
    const stackH = colItems * (CH + GAP) - GAP;
    const stackW = cols * (CW + GAP) - GAP;

    const innerH = Math.max(CH, stackH);
    const innerW = CW + (b.leaves.length > 0 ? MGR_GAP + stackW : 0);

    b.w = innerW + PAD * 2;
    b.h = innerH + PAD_TOP + PAD;
  } else {
    // Branch team: manager on top, then leaves row, then sub-blocks stacked vertically
    let contentW = CW;
    let contentH = CH; // manager

    // Leaves as a horizontal row below manager
    if (b.leaves.length > 0) {
      const leafRowW = b.leaves.length * (CW + GAP) - GAP;
      contentW = Math.max(contentW, leafRowW);
      contentH += TEAM_STACK_GAP + CH;
    }

    // Sub-blocks stacked vertically
    if (b.subBlocks.length > 0) {
      contentH += TEAM_STACK_GAP;
      let maxSubW = 0;
      let totalSubH = 0;
      for (const sb of b.subBlocks) {
        maxSubW = Math.max(maxSubW, sb.w);
        totalSubH += sb.h + TEAM_STACK_GAP;
      }
      totalSubH -= TEAM_STACK_GAP;
      contentW = Math.max(contentW, maxSubW);
      contentH += totalSubH;
    }

    b.w = contentW + PAD * 2;
    b.h = contentH + PAD_TOP + PAD;
  }
}

function place(
  b: Block,
  x: number,
  y: number,
  agentMap: Map<string, Agent>,
  companyId: string,
  out: { nodes: Node[]; edges: Edge[]; groups: Node[] },
): void {
  const isLeaf = b.subBlocks.length === 0;
  const ix = x + PAD;
  const iy = y + PAD_TOP;

  if (isLeaf) {
    // Manager on left
    const mgrY = iy + (Math.max(CH, Math.min(b.leaves.length, 8) * (CH + GAP) - GAP) - CH) / 2;
    pushAgent(out.nodes, b.node, ix, mgrY, agentMap, companyId, "senior");

    // Members stacked to the right in columns of 8
    b.leaves.forEach((leaf, i) => {
      const col = Math.floor(i / 8);
      const row = i % 8;
      const lx = ix + CW + MGR_GAP + col * (CW + GAP);
      const ly = iy + row * (CH + GAP);
      pushAgent(out.nodes, leaf, lx, ly, agentMap, companyId, "junior");
      out.edges.push({
        id: `e:${b.node.id}->${leaf.id}`,
        source: b.node.id, target: leaf.id,
        type: "editable",
        style: { stroke: b.color + "50", strokeWidth: 1 },
      });
    });
  } else {
    // Manager centered on top
    const mgrX = x + b.w / 2 - CW / 2;
    pushAgent(out.nodes, b.node, mgrX, iy, agentMap, companyId, "senior");
    let curY = iy + CH;

    // Leaves as horizontal row
    if (b.leaves.length > 0) {
      curY += TEAM_STACK_GAP;
      const leafRowW = b.leaves.length * (CW + GAP) - GAP;
      let leafX = x + b.w / 2 - leafRowW / 2;
      for (const leaf of b.leaves) {
        pushAgent(out.nodes, leaf, leafX, curY, agentMap, companyId, "junior");
        out.edges.push({
          id: `e:${b.node.id}->${leaf.id}`,
          source: b.node.id, target: leaf.id,
          type: "editable",
          style: { stroke: b.color + "50", strokeWidth: 1 },
        });
        leafX += CW + GAP;
      }
      curY += CH;
    }

    // Sub-blocks stacked vertically, left-aligned
    if (b.subBlocks.length > 0) {
      curY += TEAM_STACK_GAP;
      for (const sb of b.subBlocks) {
        place(sb, x + PAD, curY, agentMap, companyId, out);
        out.edges.push({
          id: `e:${b.node.id}->${sb.node.id}`,
          source: b.node.id, target: sb.node.id,
          type: "editable",
          style: { stroke: "var(--border)", strokeWidth: 1.5 },
        });
        curY += sb.h + TEAM_STACK_GAP;
      }
    }
  }

  // Group box
  if (b.leaves.length > 0 || b.subBlocks.length > 0) {
    out.groups.push({
      id: `group-${b.node.id}`,
      type: "teamGroup",
      position: { x, y },
      style: { width: b.w, height: b.h },
      data: { label: teamLabelWithOverride(b.node, agentMap), color: b.color },
      zIndex: 0, selectable: false, draggable: false,
    });
  }
}

// Map manager names to the team names Mario specified
const TEAM_NAME_MAP: Record<string, string> = {
  "Vance": "Authority Team",
  "Cassius": "Programmatic Pages Team",
  "Maren": "Review Intelligence Team",
  "Drake": "Technical SEO / Infrastructure Team",
  "Silas": "Data Expansion Team",
  "Callista": "Content Division",
  "Lennox": "BOR Authority Content Team",
  "Beacon": "Lead Intelligence Team",
  "Striker": "Outbound Sales Team",
  "Ledger": "Revenue Operations Team",
  "Catalyst": "Growth Strategy Team",
  "Echo": "Engineering",
  "Iris": "Operations",
  "Apollo": "Growth",
  "Quinn 2": "Client Growth Content Team",
};

let _teamNameOverrides: Record<string, string> = {};

function teamLabelWithOverride(node: OrgNode, agentMap: Map<string, Agent>): string {
  if (_teamNameOverrides[node.id]) return _teamNameOverrides[node.id];
  return teamLabel(node, agentMap);
}

function teamLabel(node: OrgNode, agentMap: Map<string, Agent>): string {
  // Check explicit map first
  if (TEAM_NAME_MAP[node.name]) return TEAM_NAME_MAP[node.name];

  // Fall back to deriving from title
  const agent = agentMap.get(node.id);
  const title = agent?.title ?? "";
  const cleaned = title
    .replace(/\s*(Manager|Director)\s*$/i, "")
    .trim();
  if (cleaned.length > 2) return cleaned;
  return node.name + "'s Team";
}

function pushAgent(
  nodes: Node[], orgNode: OrgNode, x: number, y: number,
  agentMap: Map<string, Agent>, companyId: string, tier: string,
): void {
  const agent = agentMap.get(orgNode.id);
  const meta = (agent?.metadata ?? {}) as Record<string, unknown>;
  nodes.push({
    id: orgNode.id, type: "agentCard",
    position: { x, y },
    data: {
      name: orgNode.name, role: orgNode.role, status: orgNode.status,
      title: agent?.title ?? null, icon: agent?.icon ?? null,
      adapterType: agent?.adapterType ?? "",
      tier, avatar: (meta.avatarUrl as string) ?? null,
      companyId, agentId: orgNode.id,
    },
    zIndex: 10,
  });
}

// ── Main layout ─────────────────────────────────────────────────────────────

function buildFullLayout(
  orgTree: OrgNode[], agentMap: Map<string, Agent>, companyId: string,
): { nodes: Node[]; edges: Edge[] } {
  gColorIdx = 0;
  const out = { nodes: [] as Node[], edges: [] as Edge[], groups: [] as Node[] };

  const atlasNode = orgTree.find((n) => n.role === "ceo");
  const peers = orgTree.filter((n) => n !== atlasNode && n.reports.length === 0);

  // Atlas elevated center
  const cx = 1500;
  let y = 40;

  if (atlasNode) {
    pushAgent(out.nodes, atlasNode, cx, y, agentMap, companyId, "oversight");

    // Peers flanking
    peers.forEach((peer, i) => {
      const px = i === 0 ? cx - CW - 60 : cx + CW + 60;
      pushAgent(out.nodes, peer, px, y + 30, agentMap, companyId, "oversight");
      out.edges.push({
        id: `peer:${atlasNode.id}->${peer.id}`,
        source: atlasNode.id, target: peer.id,
        type: "editable",
        style: { stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" },
      });
    });

    y += CH + SECTION_GAP;

    // Atlas's direct reports — build blocks and stack vertically on the left
    const blocks: Block[] = [];
    const directLeaves: OrgNode[] = [];

    for (const child of atlasNode.reports) {
      if (child.reports.length > 0) blocks.push(buildBlock(child));
      else directLeaves.push(child);
    }

    // Direct leaves as a row
    if (directLeaves.length > 0) {
      const rowW = directLeaves.length * (CW + GAP) - GAP;
      let lx = cx + CW / 2 - rowW / 2;
      for (const leaf of directLeaves) {
        pushAgent(out.nodes, leaf, lx, y, agentMap, companyId, "senior");
        out.edges.push({
          id: `e:${atlasNode.id}->${leaf.id}`,
          source: atlasNode.id, target: leaf.id,
          type: "editable",
          style: { stroke: "var(--border)", strokeWidth: 1.5 },
        });
        lx += CW + GAP;
      }
      y += CH + SECTION_GAP;
    }

    // Team blocks — arrange in columns to keep it compact
    // Put them in 2 columns if there are many
    const COL_COUNT = blocks.length > 6 ? 3 : blocks.length > 2 ? 2 : 1;
    const colBlocks: Block[][] = Array.from({ length: COL_COUNT }, () => []);
    const colHeights = new Array(COL_COUNT).fill(0);

    // Distribute blocks into columns (shortest column first)
    for (const blk of blocks) {
      let minCol = 0;
      for (let c = 1; c < COL_COUNT; c++) {
        if (colHeights[c] < colHeights[minCol]) minCol = c;
      }
      colBlocks[minCol].push(blk);
      colHeights[minCol] += blk.h + TEAM_STACK_GAP;
    }

    // Find max column width for positioning
    const colWidths = colBlocks.map((col) =>
      col.reduce((max, blk) => Math.max(max, blk.w), 0),
    );
    const totalW = colWidths.reduce((s, w) => s + w + SECTION_GAP, -SECTION_GAP);
    let colX = cx + CW / 2 - totalW / 2;

    for (let c = 0; c < COL_COUNT; c++) {
      let colY = y;
      for (const blk of colBlocks[c]) {
        place(blk, colX, colY, agentMap, companyId, out);
        out.edges.push({
          id: `e:${atlasNode.id}->${blk.node.id}`,
          source: atlasNode.id, target: blk.node.id,
          type: "editable",
          style: { stroke: "var(--border)", strokeWidth: 1.5 },
        });
        colY += blk.h + TEAM_STACK_GAP;
      }
      colX += colWidths[c] + SECTION_GAP;
    }
  }

  return { nodes: [...out.groups, ...out.nodes], edges: out.edges };
}

// ── OrgChart component ──────────────────────────────────────────────────────

export function OrgChart() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openNewAgent } = useDialog();
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const initializedRef = useRef(false);
  const { clearPositions } = useOrgPositions(selectedCompanyId ?? null);
  const { getFile, setFile } = useAgentFiles();
  const { isDeployed, toggleDeploy } = useDeployState();
  const [undeployedMode, setUndeployedMode] = useState<UndeployedMode>("show");
  const [showTeamBoxes, setShowTeamBoxes] = useState(true);
  const [showEdges, setShowEdges] = useState(true);
  const [hiddenTeams, setHiddenTeams] = useState<Set<string>>(new Set());
  const [teamNameOverrides, setTeamNameOverrides] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("orgchart-team-names") ?? "{}"); } catch { return {}; }
  });
  const [showTeamManager, setShowTeamManager] = useState(false);

  useEffect(() => { setBreadcrumbs([{ label: "Org Chart" }]); }, [setBreadcrumbs]);

  const { data: orgTree, isLoading } = useQuery({
    queryKey: queryKeys.org(selectedCompanyId!),
    queryFn: () => agentsApi.org(selectedCompanyId!),
    enabled: !!selectedCompanyId, refetchInterval: 30_000,
  });
  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const agentMap = useMemo(() => {
    const m = new Map<string, Agent>();
    for (const a of agents ?? []) m.set(a.id, a);
    return m;
  }, [agents]);

  const layout = useMemo(() => {
    if (!orgTree?.length || !selectedCompanyId) return null;
    _teamNameOverrides = teamNameOverrides;
    return buildFullLayout(orgTree, agentMap, selectedCompanyId);
  }, [orgTree, agentMap, selectedCompanyId, teamNameOverrides]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layout?.nodes ?? []);
  const [edges, setEdges] = useEdgesState(layout?.edges ?? []);

  // Apply deploy state + mode to nodes/edges
  const visibleLayout = useMemo(() => {
    if (!layout) return null;
    const nodesWithDeploy = layout.nodes.map((n) => {
      if (n.type === "teamGroup") return n;
      const deployed = isDeployed(n.id);
      return {
        ...n,
        data: { ...n.data, deployed, onToggleDeploy: toggleDeploy },
        hidden: !deployed && undeployedMode === "hide",
      };
    });
    // Hide edges to/from hidden nodes
    const hiddenIds = new Set(nodesWithDeploy.filter((n) => n.hidden).map((n) => n.id));
    const visibleEdges = layout.edges.map((e) => ({
      ...e,
      hidden: hiddenIds.has(e.source) || hiddenIds.has(e.target),
    }));
    // Hide empty group boxes when all their members are hidden
    const finalNodes = nodesWithDeploy.map((n) => {
      if (n.type !== "teamGroup") return n;
      const groupId = n.id.replace("group-", "");
      const hasVisibleMember = nodesWithDeploy.some(
        (mn) => mn.type === "agentCard" && !mn.hidden && layout.edges.some(
          (e) => (e.source === groupId && e.target === mn.id) || (e.source === mn.id && e.target === groupId),
        ),
      );
      // Keep group visible if the manager itself is visible
      const managerVisible = !hiddenIds.has(groupId);
      return { ...n, hidden: !managerVisible && !hasVisibleMember };
    });
    // Apply team box toggle + per-team hide
    const nodesWithBoxToggle = finalNodes.map((n) => {
      if (n.type === "teamGroup") {
        if (!showTeamBoxes) return { ...n, hidden: true };
        const managerId = n.id.replace("group-", "");
        if (hiddenTeams.has(managerId)) return { ...n, hidden: true };
      }
      return n;
    });
    // Apply edge toggle
    const finalEdges = showEdges ? visibleEdges : visibleEdges.map((e) => ({ ...e, hidden: true }));
    return { nodes: nodesWithBoxToggle, edges: finalEdges };
  }, [layout, isDeployed, toggleDeploy, undeployedMode, showTeamBoxes, showEdges, hiddenTeams]);

  useEffect(() => {
    if (visibleLayout && !initializedRef.current) {
      setNodes(visibleLayout.nodes); setEdges(visibleLayout.edges); initializedRef.current = true;
    }
  }, [visibleLayout, setNodes, setEdges]);

  // Re-apply deploy state when mode or deploy map changes
  useEffect(() => {
    if (visibleLayout && initializedRef.current) {
      setNodes(visibleLayout.nodes); setEdges(visibleLayout.edges);
    }
  }, [undeployedMode, isDeployed, showTeamBoxes, showEdges, hiddenTeams]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNodeClick: NodeMouseHandler = useCallback((_e, n) => {
    if (n.type === "teamGroup") return;
    setSelectedAgentId(n.id); setContextMenu(null);
  }, []);
  const onNodeContextMenu: NodeMouseHandler = useCallback((e, n) => {
    e.preventDefault();
    if (n.type === "teamGroup") {
      const managerId = n.id.replace("group-", "");
      const label = (n.data as { label?: string }).label ?? "Team";
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: managerId, nodeName: label, isTeam: true });
      return;
    }
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: n.id, nodeName: (n.data as { name?: string }).name ?? n.id });
  }, []);
  const onPaneClick = useCallback(() => setContextMenu(null), []);

  const handleAvatarChange = useCallback((id: string, url: string) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, avatar: url } } : n));
  }, [setNodes]);

  const handleResetLayout = useCallback(() => {
    clearPositions();
    if (!orgTree?.length || !selectedCompanyId) return;
    initializedRef.current = false;
    const fresh = buildFullLayout(orgTree, agentMap, selectedCompanyId);
    setNodes(fresh.nodes); setEdges(fresh.edges);
  }, [clearPositions, orgTree, agentMap, setNodes, setEdges, selectedCompanyId]);

  // Collect team entries for the manager panel
  const teamEntries: TeamEntry[] = useMemo(() => {
    if (!layout) return [];
    return layout.nodes
      .filter((n) => n.type === "teamGroup")
      .map((n) => ({
        managerId: n.id.replace("group-", ""),
        label: (n.data as { label: string }).label,
        color: (n.data as { color: string }).color,
      }));
  }, [layout]);

  const selectedAgent = selectedAgentId ? agentMap.get(selectedAgentId) ?? null : null;

  if (!selectedCompanyId) return <EmptyState icon={Network} message="Select a company to view the org chart." />;
  if (isLoading) return <PageSkeleton variant="org-chart" />;
  if (orgTree && !orgTree.length) return <EmptyState icon={Network} message="No organizational hierarchy defined." />;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 relative border border-border rounded-lg overflow-hidden">
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
          onNodesChange={onNodesChange} onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu} onPaneClick={onPaneClick}
          onEdgesChange={(changes) => {
            // Allow edge selection and updates
            setEdges((eds) => {
              let updated = [...eds];
              for (const change of changes) {
                if (change.type === "select") {
                  updated = updated.map((e) => e.id === change.id ? { ...e, selected: change.selected } : e);
                }
              }
              return updated;
            });
          }}
          defaultEdgeOptions={{ type: "editable", style: { strokeWidth: 1.5, stroke: "var(--border)" } }}
          fitView fitViewOptions={{ padding: 0.05 }} minZoom={0.05} maxZoom={2}
          edgesReconnectable
          selectionOnDrag
          selectionMode={"partial" as any}
          multiSelectionKeyCode="Shift"
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
          {showMinimap && <MiniMap nodeStrokeWidth={2} className="!bg-card !border-border" maskColor="rgba(0,0,0,0.1)" />}
          <OrgChartToolbar onAddAgent={openNewAgent} onResetLayout={handleResetLayout}
            showMinimap={showMinimap} onToggleMinimap={() => setShowMinimap(v => !v)}
            undeployedMode={undeployedMode}
            onCycleUndeployedMode={() => setUndeployedMode(m => m === "show" ? "dim" : m === "dim" ? "hide" : "show")}
            showTeamBoxes={showTeamBoxes} onToggleTeamBoxes={() => setShowTeamBoxes(v => !v)}
            showEdges={showEdges} onToggleEdges={() => setShowEdges(v => !v)}
            onOpenTeamManager={() => setShowTeamManager(v => !v)} />
        </ReactFlow>
        {showTeamManager && (
          <TeamManagerPanel
            teams={teamEntries}
            hiddenTeams={hiddenTeams}
            onToggleTeam={(managerId) => {
              setHiddenTeams((prev) => {
                const next = new Set(prev);
                if (next.has(managerId)) next.delete(managerId);
                else next.add(managerId);
                return next;
              });
            }}
            onRenameTeam={(managerId, newName) => {
              setTeamNameOverrides((prev) => {
                const next = { ...prev, [managerId]: newName };
                localStorage.setItem("orgchart-team-names", JSON.stringify(next));
                return next;
              });
              // Force re-layout
              initializedRef.current = false;
            }}
            onClose={() => setShowTeamManager(false)}
          />
        )}
        {contextMenu && (
          <OrgChartContextMenu menu={contextMenu} onClose={() => setContextMenu(null)}
            onEdit={(id) => { setSelectedAgentId(id); setContextMenu(null); }}
            onDelete={() => setContextMenu(null)}
            onToggleTeam={(managerId) => {
              setHiddenTeams((prev) => {
                const next = new Set(prev);
                if (next.has(managerId)) next.delete(managerId);
                else next.add(managerId);
                return next;
              });
            }}
            isTeamHidden={(managerId) => hiddenTeams.has(managerId)} />
        )}
      </div>
      {selectedAgent && (
        <AgentDetailPanel agent={selectedAgent} onClose={() => setSelectedAgentId(null)}
          onAvatarChange={handleAvatarChange} getFile={getFile} setFile={setFile} />
      )}
    </div>
  );
}
