import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Graphon } from '@graphon/react';
import { COLORS, generateSimpleGraph } from '../../helpers/graphData';

const meta: Meta<typeof Graphon> = {
  title: 'Interactions/Events',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

const { nodes, edges } = generateSimpleGraph();

export const ClickEvents: Story = {
  render: function ClickEventsStory(args) {
    const [clickedNode, setClickedNode] = useState<string | null>(null);

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
          <div>Clicked Node: {clickedNode ?? 'None'}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#95a5a6' }}>
            Click on nodes to see events
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
            onNodeClick={(node) => setClickedNode(node.id)}
            onCanvasClick={() => setClickedNode(null)}
            nodeStyleFn={(node) => ({
              shape: 'circle',
              color: node.id === clickedNode ? COLORS.secondary : COLORS.primary,
              radius: node.id === clickedNode ? 35 : 25,
            })}
          />
        </div>
      </div>
    );
  },
};

export const HoverEvents: Story = {
  render: function HoverEventsStory(args) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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
          <div>Hovered Node: {hoveredNode ?? 'None'}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#95a5a6' }}>
            Hover over nodes to see events
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
            onNodeHover={(node) => setHoveredNode(node?.id ?? null)}
            highlightNeighbors={true}
            dimOpacity={0.15}
            nodeStyleFn={(node) => ({
              shape: 'circle',
              color: node.id === hoveredNode ? COLORS.quaternary : COLORS.primary,
              radius: node.id === hoveredNode ? 35 : 25,
            })}
          />
        </div>
      </div>
    );
  },
};
