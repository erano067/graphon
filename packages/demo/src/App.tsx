import { useCallback, useMemo, useState } from 'react';
import { Graphon, type Node, type NodeShape } from '@graphon/react';
import type { EdgeData, NodeData } from './generator';
import { Controls } from './components/Controls';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Sidebar } from './components/Sidebar';
import { useGraphGenerator } from './hooks/useGraphGenerator';
import PhysicsWorker from './physics.worker?worker';

const createPhysicsWorker = (): Worker => new (PhysicsWorker as new () => Worker)();

const COMMUNITY_COLORS_HEX = [
  0xe63946, 0x2a9d8f, 0xe9c46a, 0x264653, 0xf4a261, 0x9b5de5, 0x00bbf9, 0x00f5d4,
];

const COMMUNITY_SHAPES: NodeShape[] = ['circle', 'square', 'diamond'];

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

export function App(): React.ReactElement {
  const [nodeCount, setNodeCount] = useState(100);
  const [communityCount, setCommunityCount] = useState(5);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData>>();
  const [hoveredNode, setHoveredNode] = useState<Node<NodeData>>();
  const [seed, setSeed] = useState(0);
  const [shapeMode, setShapeMode] = useState<'community' | NodeShape>('community');

  const { nodes, edges, isLoading } = useGraphGenerator({ nodeCount, communityCount, seed });

  const avgDegree = nodes.length > 0 ? ((edges.length * 2) / nodes.length).toFixed(1) : 0;
  const regenerate = useCallback(() => setSeed((s) => s + 1), []);

  const nodeStyleFn = useMemo(() => {
    return (node: Node<NodeData>) => ({
      color: COMMUNITY_COLORS_HEX[node.data.community % COMMUNITY_COLORS_HEX.length],
      shape:
        shapeMode === 'community'
          ? COMMUNITY_SHAPES[node.data.community % COMMUNITY_SHAPES.length]
          : shapeMode,
    });
  }, [shapeMode]);

  const communityFn = useCallback((node: Node<NodeData>) => node.data.community, []);
  const getCommunityColor = (community: number): string =>
    COMMUNITY_COLORS_CSS[community % COMMUNITY_COLORS_CSS.length];

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>Graphon Demo</h1>

      <Controls
        nodeCount={nodeCount}
        communityCount={communityCount}
        shapeMode={shapeMode}
        onNodeCountChange={setNodeCount}
        onCommunityCountChange={setCommunityCount}
        onShapeModeChange={setShapeMode}
        onRegenerate={regenerate}
      />

      <div style={{ display: 'flex', gap: 20 }}>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
            width: 800,
            height: 600,
          }}
        >
          {isLoading && <LoadingOverlay />}
          <Graphon<NodeData, EdgeData>
            nodes={nodes}
            edges={edges}
            width={800}
            height={600}
            nodeStyleFn={nodeStyleFn}
            communityFn={communityFn}
            createWorkerFn={createPhysicsWorker}
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
