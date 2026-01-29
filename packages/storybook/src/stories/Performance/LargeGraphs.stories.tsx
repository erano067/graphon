import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Graphon } from '@graphon/react';
import { generateLargeGraph as generateGraph } from '../../helpers/graphData';

const meta: Meta<typeof Graphon> = {
  title: 'Performance/Large Graphs',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e];

function getNodeColor(nodeId: string, nodeCount: number): number {
  const nodeNum = parseInt(nodeId.slice(1), 10) || 0;
  const groupNum = nodeNum % Math.ceil(nodeCount / 50);
  return colors[groupNum % colors.length] ?? 0x3498db;
}

const graph1000 = generateGraph(1000, 1.2);

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

const graph2000 = generateGraph(2000, 1);

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

export const Nodes50000: Story = {
  render: function Nodes50000Story(args) {
    const graph = useMemo(() => generateGraph(50000, 1.5), []);
    return (
      <Graphon
        {...args}
        nodes={graph.nodes}
        edges={graph.edges}
        width={1400}
        height={900}
        isAnimated={false}
        nodeStyleFn={() => ({ shape: 'circle', radius: 1, color: 0x3498db })}
        edgeStyleFn={() => ({ color: 0x222222, width: 0.05 })}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: '50,000 nodes with 75,000 edges. Physics disabled for performance.',
      },
    },
  },
};

export const DynamicNodeCount: Story = {
  render: function DynamicNodeCountStory(args) {
    const [nodeCount, setNodeCount] = useState(200);
    const graph = useMemo(() => generateGraph(nodeCount, 1.5), [nodeCount]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '16px', backgroundColor: '#2c3e50', color: '#ecf0f1' }}>
          <div style={{ marginBottom: '8px' }}>
            Node Count: {nodeCount} (Edges: ~{Math.floor(nodeCount * 1.5)})
          </div>
          <input
            type="range"
            min="50"
            max="10000"
            step="50"
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
            style={{ width: '300px' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            {...args}
            nodes={graph.nodes}
            edges={graph.edges}
            width={1000}
            height={600}
            isAnimated={nodeCount <= 1000}
            nodeStyleFn={(node) => ({
              shape: 'circle',
              radius: Math.max(1, 15 - nodeCount / 150),
              color: getNodeColor(node.id, nodeCount),
            })}
            edgeStyleFn={() => ({
              color: 0x444444,
              width: Math.max(0.05, 0.5 - nodeCount / 3000),
            })}
          />
        </div>
      </div>
    );
  },
};
