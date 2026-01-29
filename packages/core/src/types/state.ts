/**
 * State-related type definitions for controlled components.
 */

/** Selection state. */
export interface Selection {
  nodes: string[];
  edges: string[];
}

/** Hovered item. */
export interface HoveredItem {
  type: 'node' | 'edge' | 'cluster';
  id: string;
}

/** Viewport state. */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/** Highlight state (separate from selection). */
export interface HighlightedItems {
  nodes: string[];
  edges: string[];
}

/** Default selection constant. */
export const DEFAULT_SELECTION: Selection = { nodes: [], edges: [] };

/** Default highlight constant. */
export const DEFAULT_HIGHLIGHTED_ITEMS: HighlightedItems = { nodes: [], edges: [] };

/** Default viewport. */
export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };
