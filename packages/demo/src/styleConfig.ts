import type { ExtendedNodeShape } from '@graphon/react';

export const COMMUNITY_COLORS_HEX = [
  0xe63946, 0x2a9d8f, 0xe9c46a, 0x264653, 0xf4a261, 0x9b5de5, 0x00bbf9, 0x00f5d4,
];

export const COMMUNITY_SHAPES: ExtendedNodeShape[] = [
  'circle',
  'hexagon',
  'star',
  'triangle',
  'pentagon',
  'diamond',
  'octagon',
  'square',
];

export const COMMUNITY_COLORS_CSS = [
  '#e63946',
  '#2a9d8f',
  '#e9c46a',
  '#264653',
  '#f4a261',
  '#9b5de5',
  '#00bbf9',
  '#00f5d4',
];

export function getCommunityColor(community: number): string {
  return COMMUNITY_COLORS_CSS[community % COMMUNITY_COLORS_CSS.length];
}
