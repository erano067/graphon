import { useCallback, useMemo, useState } from 'react';
import { Graphon, type Node } from '@graphon/react';
import { type EdgeData, type NodeData, generateLatentSpaceNetwork } from './generator';
import { Controls } from './components/Controls';
import { Sidebar } from './components/Sidebar';

const COMMUNITY_COLORS_HEX = [
  0xe63946, 0x2a9d8f, 0xe9c46a, 0x264653, 0xf4a261, 0x9b5de5, 0x00bbf9, 0x00f5d4,
];

const COMMUNITY_COLORS_CSS = [
  '#e63946',
  '#2a9d8f',
  '#e9c46a',
  '#264653',
  '#f4a261',
  '#9b5de5',
  '#00bbf9',
  '#00f5d4',
];

export function App() {
  const [nodeCount, setNodeCount] = useState(100);
  const [communityCount, setCommunityCount] = useState(5);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData>>();
  const [hoveredNode, setHoveredNode] = useState<Node<NodeData>>();
  const [seed, setSeed] = useState(0);

  const { nodes, edges } = useMemo(
    () =>
      generateLatentSpaceNetwork({
        nodeCount,
        communityCount,
        avgDegree: 6,
        intraCommunityBias: 0.92,
        triangleClosureRate: 0.5,
      }),
    // seed is used to trigger regeneration on button click
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeCount, communityCount, seed]
  );

  const avgDegree = nodes.length > 0 ? ((edges.length * 2) / nodes.length).toFixed(1) : 0;
  const regenerate = useCallback(() => setSeed((s) => s + 1), []);
  const nodeColorFn = useCallback(
    (node: Node<NodeData>) =>
      COMMUNITY_COLORS_HEX[node.data.community % COMMUNITY_COLORS_HEX.length],
    []
  );
  const communityFn = useCallback((node: Node<NodeData>) => node.data.community, []);
  const getCommunityColor = (community: number) =>
    COMMUNITY_COLORS_CSS[community % COMMUNITY_COLORS_CSS.length];

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>Graphon Demo</h1>

      <Controls
        nodeCount={nodeCount}
        communityCount={communityCount}
        onNodeCountChange={setNodeCount}
        onCommunityCountChange={setCommunityCount}
        onRegenerate={regenerate}
      />

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
          <Graphon<NodeData, EdgeData>
            nodes={nodes}
            edges={edges}
            width={800}
            height={600}
            nodeColorFn={nodeColorFn}
            communityFn={communityFn}
            onNodeClick={setSelectedNode}
            onNodeHover={setHoveredNode}
          />
        </div>

        <Sidebar
          nodes={nodes}
          edges={edges}
          avgDegree={avgDegree}
          communityCount={communityCount}
          hoveredNode={hoveredNode}
          selectedNode={selectedNode}
          getCommunityColor={getCommunityColor}
        />
      </div>
    </div>
  );
}
