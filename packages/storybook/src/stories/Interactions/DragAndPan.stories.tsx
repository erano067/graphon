import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Graphon } from '@graphon/react';
import { COLORS, generateSimpleGraph } from '../../helpers/graphData';

const meta: Meta<typeof Graphon> = {
  title: 'Interactions/Drag and Pan',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

const { nodes, edges } = generateSimpleGraph();

export const DragEvents: Story = {
  render: function DragEventsStory(args) {
    const [dragState, setDragState] = useState<{
      nodeId: string | null;
      position: { x: number; y: number } | null;
    }>({ nodeId: null, position: null });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            fontFamily: 'monospace',
          }}
        >
          <div>Dragging: {dragState.nodeId ?? 'None'}</div>
          <div>
            Position:{' '}
            {dragState.position
              ? `(${dragState.position.x.toFixed(0)}, ${dragState.position.y.toFixed(0)})`
              : 'N/A'}
          </div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#95a5a6' }}>
            Drag nodes to move them
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            {...args}
            nodes={nodes}
            edges={edges}
            width={800}
            height={500}
            isAnimated={true}
            isDraggable={true}
            onNodeDrag={(nodeId, position) => setDragState({ nodeId, position })}
            onNodeDragEnd={() => setDragState({ nodeId: null, position: null })}
            nodeStyleFn={(node) => ({
              shape: 'circle',
              color: node.id === dragState.nodeId ? COLORS.secondary : COLORS.tertiary,
              radius: 25,
            })}
          />
        </div>
      </div>
    );
  },
};

export const PanAndZoom: Story = {
  render: function PanAndZoomStory(args) {
    const [zoom, setZoom] = useState(1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#2c3e50',
            color: '#ecf0f1',
            fontFamily: 'monospace',
          }}
        >
          <div>Zoom: {zoom.toFixed(2)}x</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#95a5a6' }}>
            Use mouse wheel to zoom, drag canvas to pan
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <Graphon
            {...args}
            nodes={nodes}
            edges={edges}
            width={800}
            height={500}
            isAnimated={true}
            isPannable={true}
            isZoomable={true}
            minZoom={0.2}
            maxZoom={5}
            onZoomChange={(newZoom) => setZoom(newZoom)}
            nodeStyleFn={() => ({
              shape: 'hexagon',
              color: COLORS.highlight,
              radius: 30,
            })}
          />
        </div>
      </div>
    );
  },
};

export const DisabledInteractions: Story = {
  args: {
    nodes: nodes,
    edges: edges,
    width: 800,
    height: 500,
    isAnimated: false,
    isDraggable: false,
    isPannable: false,
    isZoomable: false,
    nodeStyleFn: () => ({
      shape: 'circle',
      color: COLORS.muted,
      radius: 25,
    }),
  },
};
