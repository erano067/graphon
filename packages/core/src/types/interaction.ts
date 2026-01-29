/**
 * Interaction-related type definitions.
 */

import type { Position } from './common';

/** Pan interaction configuration. */
export interface PanConfig {
  enabled: boolean;
  button?: 'left' | 'middle' | 'right';
  modifierKey?: 'ctrl' | 'shift' | 'alt';
}

/** Zoom interaction configuration. */
export interface ZoomConfig {
  enabled: boolean;
  min?: number;
  max?: number;
  sensitivity?: number;
}

/** Selection interaction configuration. */
export interface SelectConfig {
  enabled: boolean;
  nodes?: boolean;
  edges?: boolean;
  boxSelect?: boolean;
  boxSelectKey?: 'shift' | 'ctrl' | 'alt';
}

/** Hover interaction configuration. */
export interface HoverConfig {
  enabled: boolean;
  delay?: number;
  highlightNeighbors?: boolean;
  dimNonNeighbors?: boolean;
  dimOpacity?: number;
}

/** Drag interaction configuration. */
export interface DragConfig {
  enabled: boolean;
  nodes?: boolean;
  lockAxis?: 'x' | 'y' | null;
}

/** Cluster interaction configuration. */
export interface ClusterInteractionConfig {
  expandOnDoubleClick?: boolean;
  collapseOnDoubleClick?: boolean;
}

/**
 * Complete interaction configuration.
 */
export interface InteractionsConfig {
  pan?: boolean | PanConfig;
  zoom?: boolean | ZoomConfig;
  select?: boolean | SelectConfig;
  hover?: boolean | HoverConfig;
  drag?: boolean | DragConfig;
  contextMenu?: boolean;
  cluster?: ClusterInteractionConfig;
}

/** Modifier keys state. */
export interface ModifierKeys {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

/** Base event data for all Graphon events. */
export interface GraphonEventBase {
  position: {
    graph: Position;
    screen: Position;
  };
  modifiers: ModifierKeys;
  originalEvent: MouseEvent | WheelEvent | TouchEvent;
}

/** Target of a click/hover event. */
export interface GraphonEventTarget<N = Record<string, unknown>, E = Record<string, unknown>> {
  type: 'node' | 'edge' | 'cluster' | 'canvas';
  id?: string;
  node?: { id: string; data: N };
  edge?: { id: string; source: string; target: string; data: E };
}

/** Click event data. */
export interface GraphonClickEvent<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> extends GraphonEventBase {
  target: GraphonEventTarget<N, E>;
}

/** Context menu event data. */
export interface GraphonContextMenuEvent<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> extends GraphonEventBase {
  target: GraphonEventTarget<N, E>;
}

/** Drag event data. */
export interface GraphonDragEvent<
  N = Record<string, unknown>,
  _E = Record<string, unknown>,
> extends GraphonEventBase {
  nodeId: string;
  node: { id: string; data: N };
  delta: Position;
}

/** Hover event data. */
export interface GraphonHoverEvent<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> extends GraphonEventBase {
  target: GraphonEventTarget<N, E>;
}

/** Zoom event data. */
export interface GraphonZoomEvent extends GraphonEventBase {
  zoom: number;
  delta: number;
}

/** Pan event data. */
export interface GraphonPanEvent extends GraphonEventBase {
  position: {
    graph: Position;
    screen: Position;
  };
  delta: Position;
}

/** Selection changed event data. */
export interface GraphonSelectionEvent {
  selection: { nodes: string[]; edges: string[] };
  added: { nodes: string[]; edges: string[] };
  removed: { nodes: string[]; edges: string[] };
}

/** Viewport changed event data. */
export interface GraphonViewportEvent {
  viewport: { x: number; y: number; zoom: number };
  previous: { x: number; y: number; zoom: number };
}

/** Context menu item definition. */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  items?: ContextMenuItem[];
  action?: () => void;
}

/** Expand node event data. */
export interface ExpandNodeEvent {
  nodeId: string;
  trigger: 'double-click' | 'context-menu' | 'api';
  position: Position;
}

/** Result of expanding a node (new data to add). */
export interface ExpandNodeResult<N = Record<string, unknown>, E = Record<string, unknown>> {
  nodes: { id: string; data: N }[];
  edges: { id: string; source: string; target: string; data: E }[];
}

/** Default interaction configuration. */
export const DEFAULT_INTERACTIONS: InteractionsConfig = {
  pan: true,
  zoom: { enabled: true, min: 0.1, max: 4, sensitivity: 1 },
  select: { enabled: true, nodes: true, edges: true, boxSelect: false },
  hover: { enabled: true, highlightNeighbors: true, dimNonNeighbors: true, dimOpacity: 0.15 },
  drag: { enabled: true, nodes: true },
  contextMenu: true,
  cluster: { expandOnDoubleClick: true },
};
