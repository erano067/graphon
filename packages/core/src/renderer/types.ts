import type { Edge, Node, PositionMap } from '../model/types';

export interface NodeStyle {
  radius: number;
  fill: number;
  fillAlpha: number;
  stroke: number;
  strokeWidth: number;
  strokeAlpha: number;
}

export interface EdgeStyle {
  width: number;
  color: number;
  alpha: number;
}

export interface RenderConfig {
  nodeStyle: NodeStyle;
  edgeStyle: EdgeStyle;
  backgroundColor: number;
}

export type NodeColorFn<N> = (node: { id: string; data: N }) => number;

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface HitTestResult<N, E> {
  type: 'node' | 'edge' | 'canvas';
  node?: Node<N>;
  edge?: Edge<E>;
  position: { x: number; y: number };
}

export interface RenderOptions<N> {
  nodeColorFn?: NodeColorFn<N> | undefined;
}

export interface Renderer<N, E> {
  mount(container: HTMLElement): void | Promise<void>;
  unmount(): void;
  resize(width: number, height: number): void;
  render(
    nodes: Node<N>[],
    edges: Edge<E>[],
    positions: PositionMap,
    options?: RenderOptions<N>
  ): void;
  setViewport(viewport: Viewport): void;
  getViewport(): Viewport;
  hitTest(x: number, y: number): HitTestResult<N, E>;
  destroy(): void;
}

export const DEFAULT_NODE_STYLE: NodeStyle = {
  radius: 8,
  fill: 0x4a90d9,
  fillAlpha: 1,
  stroke: 0x2d5a87,
  strokeWidth: 2,
  strokeAlpha: 1,
};

export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  width: 1,
  color: 0x999999,
  alpha: 0.8,
};

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  nodeStyle: DEFAULT_NODE_STYLE,
  edgeStyle: DEFAULT_EDGE_STYLE,
  backgroundColor: 0xffffff,
};
