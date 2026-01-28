import { Application, Container, Graphics } from 'pixi.js';
import type { Edge, Node, PositionMap } from '../model/types';
import {
  DEFAULT_RENDER_CONFIG,
  type HitTestResult,
  type RenderConfig,
  type RenderOptions,
  type Renderer,
  type Viewport,
} from './types';
import { findEdgeAt, findNodeAt, screenToWorld } from './hitTesting';
import { renderNodes } from './renderNodes';

export class PixiRenderer<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> implements Renderer<N, E> {
  private app?: Application;
  private graphContainer?: Container;
  private edgeGraphics?: Graphics;
  private nodeGraphics?: Graphics;
  private config: RenderConfig;
  private viewport: Viewport = { x: 0, y: 0, scale: 1 };
  private currentNodes: Node<N>[] = [];
  private currentEdges: Edge<E>[] = [];
  private positions = new Map<string, { x: number; y: number }>();
  private destroyed = false;

  constructor(config: Partial<RenderConfig> = {}) {
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
  }

  async mount(container: HTMLElement): Promise<void> {
    this.destroyed = false;
    const app = new Application();
    this.app = app;

    const { width, height } = container.getBoundingClientRect();

    await app.init({
      background: this.config.backgroundColor,
      width: width || 800,
      height: height || 600,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      eventFeatures: {
        wheel: false, // Disable PixiJS wheel handling - we handle zoom ourselves
      },
    });

    if (this.destroyed || this.app !== app) {
      try {
        app.destroy(true);
      } catch {
        // Already destroyed
      }
      return;
    }

    container.appendChild(app.canvas);
    this.graphContainer = new Container();
    app.stage.addChild(this.graphContainer);
    this.edgeGraphics = new Graphics();
    this.nodeGraphics = new Graphics();
    this.graphContainer.addChild(this.edgeGraphics);
    this.graphContainer.addChild(this.nodeGraphics);
  }

  unmount(app?: Application): void {
    const appToUnmount = app ?? this.app;
    if (!appToUnmount) return;
    try {
      const { canvas } = appToUnmount;
      if (canvas?.parentElement) canvas.parentElement.removeChild(canvas);
    } catch {
      // App may already be destroyed
    }
  }

  resize(width: number, height: number): void {
    this.app?.renderer.resize(width, height);
  }

  render(
    nodes: Node<N>[],
    edges: Edge<E>[],
    positions: PositionMap,
    options?: RenderOptions<N>
  ): void {
    this.currentNodes = nodes;
    this.currentEdges = edges;
    this.positions = positions; // Direct reference, no copy needed

    const isLargeGraph = nodes.length > this.config.largeGraphThreshold;
    const shouldSkipEdges = isLargeGraph && options?.isInteracting === true;

    if (shouldSkipEdges) {
      this.edgeGraphics?.clear();
    } else {
      this.renderEdges(edges);
    }

    this.renderNodesInternal(nodes, options);
    this.applyViewport();
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
    this.applyViewport();
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  hitTest(screenX: number, screenY: number): HitTestResult<N, E> {
    const worldPos = screenToWorld(screenX, screenY, this.viewport);

    const { nodeStyle, edgeStyle } = this.config;
    const hitNode = findNodeAt(worldPos, this.currentNodes, this.positions, nodeStyle.radius);
    if (hitNode) return { type: 'node', node: hitNode, position: worldPos };

    const hitEdge = findEdgeAt(worldPos, this.currentEdges, this.positions, edgeStyle.width + 4);
    if (hitEdge) return { type: 'edge', edge: hitEdge, position: worldPos };

    return { type: 'canvas', position: worldPos };
  }

  destroy(): void {
    this.destroyed = true;
    const { app, graphContainer, edgeGraphics, nodeGraphics } = this;

    delete this.app;
    delete this.graphContainer;
    delete this.edgeGraphics;
    delete this.nodeGraphics;

    if (!app) return;

    this.unmount(app);

    try {
      nodeGraphics?.destroy();
      edgeGraphics?.destroy();
      graphContainer?.destroy();
      app.destroy(true);
    } catch {
      // Already destroyed
    }
  }

  private renderEdges(edges: Edge<E>[]): void {
    if (!this.edgeGraphics) return;
    this.edgeGraphics.clear();

    if (edges.length === 0) return;

    const style = this.config.edgeStyle;
    const g = this.edgeGraphics;

    // Batch all edge paths, then stroke once
    for (const edge of edges) {
      const source = this.positions.get(edge.source);
      const target = this.positions.get(edge.target);
      if (!source || !target) continue;

      g.moveTo(source.x, source.y);
      g.lineTo(target.x, target.y);
    }

    g.stroke({ width: style.width, color: style.color, alpha: style.alpha });
  }
  private renderNodesInternal(nodes: Node<N>[], options?: RenderOptions<N>): void {
    if (!this.nodeGraphics) return;
    renderNodes({
      graphics: this.nodeGraphics,
      nodes,
      positions: this.positions,
      nodeStyle: this.config.nodeStyle,
      largeGraphThreshold: this.config.largeGraphThreshold,
      ...(options && { options }),
    });
  }

  private applyViewport(): void {
    if (!this.graphContainer) return;
    this.graphContainer.position.set(this.viewport.x, this.viewport.y);
    this.graphContainer.scale.set(this.viewport.scale);
  }
}

export const createRenderer = <N = Record<string, unknown>, E = Record<string, unknown>>(
  config?: Partial<RenderConfig>
): PixiRenderer<N, E> => new PixiRenderer<N, E>(config);
