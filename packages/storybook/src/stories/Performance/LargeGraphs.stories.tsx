import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import type { Edge, Node } from '@graphon/core';
import { Graphon } from '@graphon/react';

const meta: Meta<typeof Graphon> = {
  title: 'Performance/Large Graphs',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

interface NodeData {
  label: string;
  group: number;
}

function generateLargeGraph(
  nodeCount: number,
  edgeDensity: number
): { nodes: Node<NodeData>[]; edges: Edge<Record<string, never>>[] } {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge<Record<string, never>>[] = [];
  const groupCount = Math.ceil(nodeCount / 50);

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `n${i}`,
      data: { label: `Node ${i}`, group: i % groupCount },
    });
  }

  const targetEdgeCount = Math.floor(nodeCount * edgeDensity);
  const addedEdges = new Set<string>();

  while (edges.length < targetEdgeCount) {
    const source = Math.floor(Math.random() * nodeCount);
    const target = Math.floor(Math.random() * nodeCount);

    if (source !== target) {
      const edgeKey = source < target ? `${source}-${target}` : `${target}-${source}`;
      if (!addedEdges.has(edgeKey)) {
        addedEdges.add(edgeKey);
        edges.push({
          id: `e${edges.length}`,
          source: `n${source}`,
          target: `n${target}`,
          data: {},
        });
      }
    }
  }

  return { nodes, edges };
}

const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e];

function getNodeColor(nodeId: string, nodeCount: number): number {
  const nodeNum = parseInt(nodeId.slice(1), 10) || 0;
  const groupNum = nodeNum % Math.ceil(nodeCount / 50);
  return colors[groupNum % colors.length] ?? 0x3498db;
}

const graph1000 = generateLargeGraph(1000, 1.2);

export const Nodes1000: Story = {
  args: {
    nodes: graph1000.nodes,
    edges: graph1000.edges,
    width: 1000,
    height: 700,
    isAnimated: true,
    nodeStyleFn: (node) => ({
      shape: 'circle',
      radius: 5,
      color: getNodeColor(node.id, 1000),
    }),
    edgeStyleFn: () => ({ color: 0x333333, width: 0.2 }),
  },
};

const graph2000 = generateLargeGraph(2000, 1);

export const Nodes2000: Story = {
  args: {
    nodes: graph2000.nodes,
    edges: graph2000.edges,
    width: 1200,
    height: 800,
    isAnimated: false,
    nodeStyleFn: (node) => ({
      shape: 'circle',
      radius: 3,
      color: getNodeColor(node.id, 2000),
    }),
    edgeStyleFn: () => ({ color: 0x222222, width: 0.1 }),
  },
};

export const DynamicNodeCount: Story = {
  render: function DynamicNodeCountStory() {
    const [nodeCount, setNodeCount] = useState(200);
    const graph = useMemo(() => generateLargeGraph(nodeCount, 1.5), [nodeCount]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '16px', backgroundColor: '#2c3e50', color: '#ecf0f1' }}>
          <div style={{ marginBottom: '8px' }}>
            Node Count: {nodeCount} (Edges: ~{Math.floor(nodeCount * 1.5)})
          </div>
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
            style={{ width: '300px' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            nodes={graph.nodes}
            edges={graph.edges}
            width={1000}
            height={600}
            isAnimated={true}
            nodeStyleFn={(node) => ({
              shape: 'circle',
              radius: Math.max(3, 15 - nodeCount / 150),
              color: getNodeColor(node.id, nodeCount),
            })}
            edgeStyleFn={() => ({
              color: 0x444444,
              width: Math.max(0.1, 0.5 - nodeCount / 3000),
            })}
          />
        </div>
      </div>
    );
  },
};
