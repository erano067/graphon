import type { Meta, StoryObj } from '@storybook/react';
import type { Edge, Node } from '@graphon/core';
import { Graphon } from '@graphon/react';
import { COLORS } from '../../helpers/graphData';

const meta: Meta<typeof Graphon> = {
  title: 'Styling/Edge Styling',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Customize edge appearance with colors and widths.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

const basicNodes: Node<{ label: string }>[] = [
  { id: 'a', data: { label: 'A' } },
  { id: 'b', data: { label: 'B' } },
  { id: 'c', data: { label: 'C' } },
  { id: 'd', data: { label: 'D' } },
  { id: 'e', data: { label: 'E' } },
];

const weightedEdges: Edge<{ weight: number }>[] = [
  { id: 'ab', source: 'a', target: 'b', data: { weight: 1 } },
  { id: 'bc', source: 'b', target: 'c', data: { weight: 3 } },
  { id: 'cd', source: 'c', target: 'd', data: { weight: 5 } },
  { id: 'de', source: 'd', target: 'e', data: { weight: 2 } },
  { id: 'ea', source: 'e', target: 'a', data: { weight: 4 } },
  { id: 'ac', source: 'a', target: 'c', data: { weight: 1 } },
];

export const WeightedEdges: Story = {
  args: {
    nodes: basicNodes,
    edges: weightedEdges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: () => ({
      shape: 'circle',
      color: COLORS.primary,
      radius: 25,
    }),
    edgeStyleFn: (edge) => {
      const weightMap: Record<string, number> = { ab: 1, bc: 3, cd: 5, de: 2, ea: 4, ac: 1 };
      const weight = weightMap[edge.id] ?? 2;
      return { color: 0x95a5a6, width: weight * 2 };
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge width based on weight data.',
      },
    },
  },
};

const coloredEdges: Edge<{ type: string }>[] = [
  { id: 'ab', source: 'a', target: 'b', data: { type: 'strong' } },
  { id: 'bc', source: 'b', target: 'c', data: { type: 'weak' } },
  { id: 'cd', source: 'c', target: 'd', data: { type: 'strong' } },
  { id: 'de', source: 'd', target: 'e', data: { type: 'neutral' } },
  { id: 'ea', source: 'e', target: 'a', data: { type: 'weak' } },
];

export const ColoredEdges: Story = {
  args: {
    nodes: basicNodes,
    edges: coloredEdges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: () => ({
      shape: 'circle',
      color: 0x34495e,
      radius: 25,
    }),
    edgeStyleFn: (edge) => {
      const typeMap: Record<string, string> = {
        ab: 'strong',
        bc: 'weak',
        cd: 'strong',
        de: 'neutral',
        ea: 'weak',
      };
      const typeColors: Record<string, number> = {
        strong: COLORS.tertiary,
        weak: COLORS.secondary,
        neutral: COLORS.muted,
      };
      const type = typeMap[edge.id] ?? 'neutral';
      return { color: typeColors[type] ?? COLORS.muted, width: 3 };
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge colors based on relationship type.',
      },
    },
  },
};

export const OpacityByWeight: Story = {
  args: {
    nodes: basicNodes,
    edges: weightedEdges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: () => ({
      shape: 'circle',
      color: COLORS.highlight,
      radius: 25,
    }),
    edgeStyleFn: (edge) => {
      const weightMap: Record<string, number> = { ab: 1, bc: 3, cd: 5, de: 2, ea: 4, ac: 1 };
      const weight = weightMap[edge.id] ?? 2;
      return { color: COLORS.muted, width: 3, alpha: 0.2 + (weight / 5) * 0.8 };
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge opacity varies with weight.',
      },
    },
  },
};

const hubNodes: Node<{ label: string; isHub: boolean }>[] = [
  { id: 'hub', data: { label: 'Hub', isHub: true } },
  { id: 'a', data: { label: 'A', isHub: false } },
  { id: 'b', data: { label: 'B', isHub: false } },
  { id: 'c', data: { label: 'C', isHub: false } },
  { id: 'd', data: { label: 'D', isHub: false } },
  { id: 'e', data: { label: 'E', isHub: false } },
];

const hubEdges: Edge<Record<string, never>>[] = [
  { id: 'ha', source: 'hub', target: 'a', data: {} },
  { id: 'hb', source: 'hub', target: 'b', data: {} },
  { id: 'hc', source: 'hub', target: 'c', data: {} },
  { id: 'hd', source: 'hub', target: 'd', data: {} },
  { id: 'he', source: 'hub', target: 'e', data: {} },
];

export const HubAndSpoke: Story = {
  args: {
    nodes: hubNodes,
    edges: hubEdges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: (node) => ({
      shape: node.id === 'hub' ? 'hexagon' : 'circle',
      color: node.id === 'hub' ? COLORS.quaternary : COLORS.primary,
      radius: node.id === 'hub' ? 40 : 20,
    }),
    edgeStyleFn: () => ({
      color: COLORS.muted,
      width: 2,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Hub-and-spoke layout with highlighted central node.',
      },
    },
  },
};

export const ConsistentStyling: Story = {
  args: {
    nodes: basicNodes,
    edges: weightedEdges,
    width: 800,
    height: 600,
    isAnimated: true,
    nodeStyleFn: () => ({
      shape: 'circle',
      color: COLORS.primary,
      radius: 25,
      strokeColor: 0x2980b9,
      strokeWidth: 2,
    }),
    edgeStyleFn: () => ({
      color: 0x2980b9,
      width: 2,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Consistent visual style with matching node stroke and edge colors.',
      },
    },
  },
};
