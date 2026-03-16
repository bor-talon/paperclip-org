import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAgentStore, useUIStore } from './store';
import { getLayoutedElements } from './utils';
import { AgentNode, DetailPanel, Header } from './components';

const nodeTypes = {
  agentNode: AgentNode,
};

export function App() {
  const { agents, selectAgent } = useAgentStore();
  const { theme, isDetailPanelOpen, setDetailPanelOpen } = useUIStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Update flow when agents change
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(agents, []);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [agents, setNodes, setEdges]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectAgent(node.id);
      setDetailPanelOpen(true);
    },
    [selectAgent, setDetailPanelOpen]
  );

  const onPaneClick = useCallback(() => {
    selectAgent(null);
    setDetailPanelOpen(false);
  }, [selectAgent, setDetailPanelOpen]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50 dark:bg-gray-900"
          >
            <Background color="#ccc" gap={20} />
            <Controls />
          </ReactFlow>
        </div>

        {isDetailPanelOpen && <DetailPanel />}
      </div>
    </div>
  );
}
