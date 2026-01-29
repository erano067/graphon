import type { Meta, StoryObj } from '@storybook/react';
import type { Node } from '@graphon/core';
import { Graphon } from '@graphon/react';
import { COLORS, generateSimpleGraph } from '../../helpers/graphData';

const meta: Meta<typeof Graphon> = {
  title: 'Styling/Node Styling',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Customize node appearance with colors, sizes, and shapes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

const { nodes, edges } = generateSimpleGraph();

export const ColorByCategory: Story = {
  args: {
    nodes: nodes,
    edges: edges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: () => ({
      shape: 'circle',
      color: COLORS.primary,
      radius: 25,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Nodes colored based on their category data.',
      },
    },
  },
};

const valuedNodes: Node<{ label: string; value: number }>[] = [
  { id: 'a', data: { label: 'A', value: 20 } },
  { id: 'b', data: { label: 'B', value: 50 } },
  { id: 'c', data: { label: 'C', value: 100 } },
  { id: 'd', data: { label: 'D', value: 30 } },
  { id: 'e', data: { label: 'E', value: 80 } },
];

const valuedEdges = [
  { id: 'ab', source: 'a', target: 'b', data: {} },
  { id: 'bc', source: 'b', target: 'c', data: {} },
  { id: 'cd', source: 'c', target: 'd', data: {} },
  { id: 'de', source: 'd', target: 'e', data: {} },
  { id: 'ea', source: 'e', target: 'a', data: {} },
];

export const SizeByValue: Story = {
  args: {
    nodes: valuedNodes,
    edges: valuedEdges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: (node) => {
      const valueMap: Record<string, number> = { a: 20, b: 50, c: 100, d: 30, e: 80 };
      const value = valueMap[node.id] ?? 50;
      const minRadius = 15;
      const maxRadius = 50;
      const normalizedRadius = minRadius + (value / 100) * (maxRadius - minRadius);
      return {
        shape: 'circle',
        color: COLORS.primary,
        radius: normalizedRadius,
      };
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Node radius determined by numeric value data.',
      },
    },
  },
};

export const ColorGradientByValue: Story = {
  args: {
    nodes: valuedNodes,
    edges: valuedEdges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: (node) => {
      const valueMap: Record<string, number> = { a: 20, b: 50, c: 100, d: 30, e: 80 };
      const value = valueMap[node.id] ?? 50;
      const t = value / 100;
      const r = Math.floor(231 * (1 - t) + 46 * t);
      const g = Math.floor(76 * (1 - t) + 204 * t);
      const b = Math.floor(60 * (1 - t) + 113 * t);
      const color = (r << 16) | (g << 8) | b;
      return {
        shape: 'circle',
        color,
        radius: 30,
      };
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Node color interpolated from red to green based on value.',
      },
    },
  },
};

export const ShapeByCategory: Story = {
  args: {
    nodes: nodes,
    edges: edges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: () => ({
      shape: 'circle',
      color: COLORS.primary,
      radius: 25,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Different shapes for different categories.',
      },
    },
  },
};

export const CombinedStyling: Story = {
  args: {
    nodes: valuedNodes,
    edges: valuedEdges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: (node) => {
      const valueMap: Record<string, number> = { a: 20, b: 50, c: 100, d: 30, e: 80 };
      const value = valueMap[node.id] ?? 50;
      const t = value / 100;
      const radius = 15 + t * 35;
      const r = Math.floor(231 * (1 - t) + 46 * t);
      const g = Math.floor(76 * (1 - t) + 204 * t);
      const b = Math.floor(60 * (1 - t) + 113 * t);
      const color = (r << 16) | (g << 8) | b;
      return {
        shape: 'circle',
        color,
        radius,
      };
    },
    edgeStyleFn: () => ({
      color: 0x95a5a6,
      width: 2,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Combined size and color styling based on value.',
      },
    },
  },
};

export const StrokeStyles: Story = {
  args: {
    nodes: nodes,
    edges: edges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: () => ({
      shape: 'circle',
      color: COLORS.primary,
      radius: 25,
      strokeColor: 0xffffff,
      strokeWidth: 3,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Nodes with white stroke borders.',
      },
    },
  },
};
