import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Edge, LayoutWorkerType, Node, Position } from '@graphon/core';
import { createLayout } from '@graphon/core';
import { Graphon } from '@graphon/react';
import { generateNetworkGraph } from '../../helpers/graphData';
import { useLayoutWorker } from '../../helpers/useLayoutWorker';

const meta: Meta<typeof Graphon> = {
  title: 'Layouts/Layout Algorithms',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Pre-computed layout algorithms that calculate node positions without physics simulation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

const graphData = generateNetworkGraph(50, 0.08);

function computeLayoutSync(
  layoutType: LayoutWorkerType,
  width: number,
  height: number
): Map<string, Position> {
  const layout = createLayout(layoutType, { width, height, padding: 50 });
  return layout.compute(
    graphData.nodes as unknown as Node<Record<string, unknown>>[],
    graphData.edges as unknown as Edge<Record<string, unknown>>[]
  );
}

function withPositions(positions: Map<string, Position>): typeof graphData.nodes {
  return graphData.nodes
    .filter((node) => positions.has(node.id))
    .map((node) => ({ ...node, position: positions.get(node.id)! }));
}

export const GridLayout: Story = {
  render: function GridLayoutStory(args) {
    const positions = useMemo(() => computeLayoutSync('grid', 800, 600), []);
    const nodesWithPositions = useMemo(() => withPositions(positions), [positions]);

    return (
      <Graphon
        {...args}
        nodes={nodesWithPositions}
        edges={graphData.edges}
        width={800}
        height={600}
        isAnimated={false}
        nodeStyleFn={() => ({ shape: 'circle', radius: 12, color: 0x3498db })}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Nodes arranged in a grid pattern. Fast and deterministic.',
      },
    },
  },
};

export const CircularLayout: Story = {
  render: function CircularLayoutStory(args) {
    const positions = useMemo(() => computeLayoutSync('circular', 800, 600), []);
    const nodesWithPositions = useMemo(() => withPositions(positions), [positions]);

    return (
      <Graphon
        {...args}
        nodes={nodesWithPositions}
        edges={graphData.edges}
        width={800}
        height={600}
        isAnimated={false}
        nodeStyleFn={() => ({ shape: 'circle', radius: 12, color: 0xe74c3c })}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Nodes arranged in a circle. Good for showing overall connectivity.',
      },
    },
  },
};

export const ConcentricLayout: Story = {
  render: function ConcentricLayoutStory(args) {
    const positions = useMemo(() => computeLayoutSync('concentric', 800, 600), []);
    const nodesWithPositions = useMemo(() => withPositions(positions), [positions]);

    return (
      <Graphon
        {...args}
        nodes={nodesWithPositions}
        edges={graphData.edges}
        width={800}
        height={600}
        isAnimated={false}
        nodeStyleFn={() => ({ shape: 'circle', radius: 12, color: 0x2ecc71 })}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Nodes in concentric circles based on degree. High-degree nodes in center.',
      },
    },
  },
};

export const RadialLayout: Story = {
  render: function RadialLayoutStory(args) {
    const positions = useMemo(() => computeLayoutSync('radial', 800, 600), []);
    const nodesWithPositions = useMemo(() => withPositions(positions), [positions]);

    return (
      <Graphon
        {...args}
        nodes={nodesWithPositions}
        edges={graphData.edges}
        width={800}
        height={600}
        isAnimated={false}
        nodeStyleFn={() => ({ shape: 'circle', radius: 12, color: 0xf39c12 })}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Tree-like radial layout from a center node. Good for hierarchical data.',
      },
    },
  },
};

export const ForceLayout: Story = {
  render: function ForceLayoutStory(args) {
    const positions = useMemo(() => {
      const layout = createLayout('force', {
        width: 800,
        height: 600,
        padding: 50,
        iterations: 100,
      });
      return layout.compute(
        graphData.nodes as unknown as Node<Record<string, unknown>>[],
        graphData.edges as unknown as Edge<Record<string, unknown>>[]
      );
    }, []);

    const nodesWithPositions = useMemo(() => withPositions(positions), [positions]);

    return (
      <Graphon
        {...args}
        nodes={nodesWithPositions}
        edges={graphData.edges}
        width={800}
        height={600}
        isAnimated={false}
        nodeStyleFn={() => ({ shape: 'circle', radius: 12, color: 0x9b59b6 })}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Force-directed layout pre-computed to completion. No animation needed.',
      },
    },
  },
};

const layoutColors: Record<LayoutWorkerType, number> = {
  grid: 0x3498db,
  circular: 0xe74c3c,
  concentric: 0x2ecc71,
  radial: 0xf39c12,
  force: 0x9b59b6,
};

export const LayoutComparison: Story = {
  render: function LayoutComparisonStory(args) {
    const [layoutType, setLayoutType] = useState<LayoutWorkerType>('grid');

    const positions = useMemo(() => {
      if (layoutType === 'force') {
        const layout = createLayout('force', {
          width: 900,
          height: 600,
          padding: 50,
          iterations: 100,
        });
        return layout.compute(
          graphData.nodes as unknown as Node<Record<string, unknown>>[],
          graphData.edges as unknown as Edge<Record<string, unknown>>[]
        );
      }
      return computeLayoutSync(layoutType, 900, 600);
    }, [layoutType]);

    const nodesWithPositions = useMemo(() => withPositions(positions), [positions]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <span>Layout:</span>
          {(['grid', 'circular', 'concentric', 'radial', 'force'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setLayoutType(type)}
              style={{
                padding: '8px 16px',
                backgroundColor:
                  layoutType === type ? `#${layoutColors[type].toString(16)}` : '#34495e',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            {...args}
            nodes={nodesWithPositions}
            edges={graphData.edges}
            width={900}
            height={600}
            isAnimated={false}
            nodeStyleFn={() => ({
              shape: 'circle',
              radius: 12,
              color: layoutColors[layoutType],
            })}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compare different layout algorithms interactively.',
      },
    },
  },
};

export const WorkerComputation: Story = {
  render: function WorkerComputationStory(args) {
    const { positions, isComputing, duration, compute } = useLayoutWorker();
    const [layoutType, setLayoutType] = useState<LayoutWorkerType>('grid');

    const handleCompute = useCallback(
      (type: LayoutWorkerType) => {
        setLayoutType(type);
        compute(
          graphData.nodes as unknown as Node<Record<string, unknown>>[],
          graphData.edges as unknown as Edge<Record<string, unknown>>[],
          type,
          { width: 900, height: 600, padding: 50, iterations: 100 }
        );
      },
      [compute]
    );

    useEffect(() => {
      handleCompute('grid');
    }, [handleCompute]);

    const nodesWithPositions = useMemo(() => withPositions(positions), [positions]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <span>Layout (Worker):</span>
          {(['grid', 'circular', 'concentric', 'radial', 'force'] as const).map((type) => (
            <button
              key={type}
              onClick={() => handleCompute(type)}
              disabled={isComputing}
              style={{
                padding: '8px 16px',
                backgroundColor:
                  layoutType === type ? `#${layoutColors[type].toString(16)}` : '#34495e',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: isComputing ? 'wait' : 'pointer',
                textTransform: 'capitalize',
                opacity: isComputing ? 0.7 : 1,
              }}
            >
              {type}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#95a5a6' }}>
            {isComputing ? 'Computing...' : `Computed in ${duration.toFixed(1)}ms`}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            {...args}
            nodes={nodesWithPositions}
            edges={graphData.edges}
            width={900}
            height={600}
            isAnimated={false}
            nodeStyleFn={() => ({
              shape: 'circle',
              radius: 12,
              color: layoutColors[layoutType],
            })}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout computed in a Web Worker (off main thread). Shows computation time.',
      },
    },
  },
};
