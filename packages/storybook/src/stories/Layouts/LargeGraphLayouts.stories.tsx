import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LayoutWorkerType, Node, Position } from '@graphon/core';
import { Graphon } from '@graphon/react';
import { generateLargeGraph } from '../../helpers/graphData';
import { useLayoutWorker } from '../../helpers/useLayoutWorker';

const meta: Meta<typeof Graphon> = {
  title: 'Layouts/Large Graph Layouts',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Layout algorithms for large graphs (10k-50k nodes) computed in a Web Worker.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

const layoutColors: Record<LayoutWorkerType, number> = {
  grid: 0x3498db,
  circular: 0xe74c3c,
  concentric: 0x2ecc71,
  radial: 0xf39c12,
  force: 0x9b59b6,
};

function applyPositions<N>(
  nodes: Node<N>[],
  positions: Map<string, Position>
): Array<Node<N> & { position: Position }> {
  return nodes
    .filter((node) => positions.has(node.id))
    .map((node) => ({
      ...node,
      position: positions.get(node.id)!,
    }));
}

export const TenThousandNodes: Story = {
  render: function TenThousandNodesStory(args) {
    const graphData = useMemo(() => generateLargeGraph(10000, 1.5), []);
    const { positions, isComputing, duration, compute } = useLayoutWorker();
    const [layoutType, setLayoutType] = useState<LayoutWorkerType>('grid');

    const handleCompute = useCallback(
      (type: LayoutWorkerType) => {
        setLayoutType(type);
        compute(graphData.nodes, graphData.edges, type, {
          width: 1200,
          height: 800,
          padding: 20,
          ...(type === 'force' && { iterations: 30 }),
        });
      },
      [compute, graphData]
    );

    useEffect(() => {
      handleCompute('grid');
    }, [handleCompute]);

    const nodesWithPositions = useMemo(
      () => applyPositions(graphData.nodes, positions),
      [graphData.nodes, positions]
    );

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
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 'bold' }}>10,000 nodes</span>
          <span style={{ color: '#95a5a6' }}>|</span>
          {(['grid', 'circular', 'concentric', 'radial'] as const).map((type) => (
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
            {isComputing ? 'Computing layout...' : `Layout computed in ${duration.toFixed(0)}ms`}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            {...args}
            nodes={nodesWithPositions}
            edges={graphData.edges}
            width={1200}
            height={800}
            isAnimated={false}
            nodeStyleFn={() => ({
              shape: 'circle',
              radius: 2,
              color: layoutColors[layoutType],
            })}
            edgeStyleFn={() => ({ color: 0x333333, width: 0.1 })}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '10,000 nodes with different layout algorithms. Force layout is omitted for performance.',
      },
    },
  },
};

export const FiftyThousandNodes: Story = {
  render: function FiftyThousandNodesStory(args) {
    const graphData = useMemo(() => generateLargeGraph(50000, 1.2), []);
    const { positions, isComputing, duration, compute } = useLayoutWorker();
    const [layoutType, setLayoutType] = useState<LayoutWorkerType>('grid');

    const handleCompute = useCallback(
      (type: LayoutWorkerType) => {
        setLayoutType(type);
        compute(graphData.nodes, graphData.edges, type, {
          width: 1400,
          height: 900,
          padding: 10,
        });
      },
      [compute, graphData]
    );

    useEffect(() => {
      handleCompute('grid');
    }, [handleCompute]);

    const nodesWithPositions = useMemo(
      () => applyPositions(graphData.nodes, positions),
      [graphData.nodes, positions]
    );

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
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 'bold' }}>50,000 nodes</span>
          <span style={{ color: '#95a5a6' }}>|</span>
          {(['grid', 'circular'] as const).map((type) => (
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
          <span
            style={{
              fontSize: '12px',
              color: '#e74c3c',
              padding: '4px 8px',
              backgroundColor: 'rgba(231, 76, 60, 0.2)',
              borderRadius: '4px',
            }}
          >
            Concentric/Radial disabled (too slow for 50k nodes)
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#95a5a6' }}>
            {isComputing ? 'Computing layout...' : `Layout computed in ${duration.toFixed(0)}ms`}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            {...args}
            nodes={nodesWithPositions}
            edges={graphData.edges}
            width={1400}
            height={900}
            isAnimated={false}
            nodeStyleFn={() => ({
              shape: 'circle',
              radius: 1,
              color: layoutColors[layoutType],
            })}
            edgeStyleFn={() => ({ color: 0x222222, width: 0.05 })}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '50,000 nodes with Grid and Circular layouts (fastest algorithms for very large graphs).',
      },
    },
  },
};

export const LayoutPerformanceTest: Story = {
  render: function LayoutPerformanceTestStory(args) {
    const [nodeCount, setNodeCount] = useState(1000);
    const [results, setResults] = useState<Array<{ layout: string; count: number; time: number }>>(
      []
    );
    const graphData = useMemo(() => generateLargeGraph(nodeCount, 1.5), [nodeCount]);
    const { positions, isComputing, compute } = useLayoutWorker();

    const runBenchmark = useCallback(async () => {
      const layouts: LayoutWorkerType[] = ['grid', 'circular', 'concentric', 'radial'];
      const newResults: Array<{ layout: string; count: number; time: number }> = [];

      for (const layout of layouts) {
        const start = performance.now();
        await compute(graphData.nodes, graphData.edges, layout, {
          width: 1000,
          height: 700,
          padding: 30,
        });
        const time = performance.now() - start;
        newResults.push({ layout, count: nodeCount, time });
      }

      setResults(newResults);
    }, [compute, graphData, nodeCount]);

    const nodesWithPositions = useMemo(
      () => applyPositions(graphData.nodes, positions),
      [graphData.nodes, positions]
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
            <label>
              Nodes:{' '}
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={nodeCount}
                onChange={(e) => setNodeCount(Number(e.target.value))}
                style={{ width: '200px' }}
              />
              <span style={{ marginLeft: '8px' }}>{nodeCount.toLocaleString()}</span>
            </label>
            <button
              onClick={runBenchmark}
              disabled={isComputing}
              style={{
                padding: '8px 24px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: isComputing ? 'wait' : 'pointer',
              }}
            >
              {isComputing ? 'Running...' : 'Run Benchmark'}
            </button>
          </div>
          {results.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              {results.map((r) => (
                <div
                  key={r.layout}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#34495e',
                    borderRadius: '4px',
                    textTransform: 'capitalize',
                  }}
                >
                  <strong>{r.layout}</strong>: {r.time.toFixed(1)}ms
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            {...args}
            nodes={nodesWithPositions}
            edges={graphData.edges}
            width={1000}
            height={700}
            isAnimated={false}
            nodeStyleFn={() => ({
              shape: 'circle',
              radius: Math.max(1, 10 - nodeCount / 1000),
              color: 0x3498db,
            })}
            edgeStyleFn={() => ({
              color: 0x333333,
              width: Math.max(0.05, 0.3 - nodeCount / 10000),
            })}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Benchmark different layout algorithms at various node counts.',
      },
    },
  },
};
