import type { Meta, StoryObj } from '@storybook/react';
import { useMemo } from 'react';
import { Graphon } from '@graphon/react';
import {
  COLORS,
  generateLargeGraph,
  generateNetworkGraph,
  generateSimpleGraph,
} from '../../helpers/graphData';

const meta: Meta<typeof Graphon> = {
  title: 'Basics/Basic Graph',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Basic graph rendering with nodes and edges.',
      },
    },
  },
  argTypes: {
    width: { control: { type: 'number', min: 400, max: 1600, step: 100 } },
    height: { control: { type: 'number', min: 300, max: 1200, step: 100 } },
    isAnimated: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

const simpleData = generateSimpleGraph();

export const Simple: Story = {
  args: {
    nodes: simpleData.nodes,
    edges: simpleData.edges,
    width: 800,
    height: 600,
    isAnimated: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'A simple graph with 5 nodes and 6 edges demonstrating basic rendering.',
      },
    },
  },
};

const mediumData = generateNetworkGraph(100, 0.05);

export const MediumNetwork: Story = {
  args: {
    nodes: mediumData.nodes,
    edges: mediumData.edges,
    width: 800,
    height: 600,
    isAnimated: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'A medium-sized network with ~100 nodes showing force-directed layout.',
      },
    },
  },
};

export const LargeNetwork: Story = {
  render: function LargeNetworkStory(args) {
    const graph = useMemo(() => generateLargeGraph(50000, 1.5), []);
    return (
      <Graphon
        {...args}
        nodes={graph.nodes}
        edges={graph.edges}
        nodeStyleFn={() => ({ shape: 'circle', radius: 1, color: 0x3498db })}
        edgeStyleFn={() => ({ color: 0x333333, width: 0.1 })}
      />
    );
  },
  args: {
    width: 1200,
    height: 800,
    isAnimated: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'A large network with 50,000 nodes. Physics disabled for performance.',
      },
    },
  },
};

export const StaticLayout: Story = {
  args: {
    nodes: simpleData.nodes,
    edges: simpleData.edges,
    width: 800,
    height: 600,
    isAnimated: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Graph with physics simulation disabled (static layout).',
      },
    },
  },
};

export const WithNodeStyles: Story = {
  args: {
    nodes: simpleData.nodes,
    edges: simpleData.edges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: () => ({
      color: COLORS.primary,
      radius: 25,
      shape: 'circle',
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Graph with custom node styling based on category.',
      },
    },
  },
};

export const WithEdgeStyles: Story = {
  args: {
    nodes: simpleData.nodes,
    edges: simpleData.edges,
    width: 800,
    height: 600,
    isAnimated: true,
    edgeStyleFn: () => ({
      color: 0x95a5a6,
      width: 2,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Graph with edge width based on weight.',
      },
    },
  },
};
