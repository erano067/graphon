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

export class PixiRenderer<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> implements Renderer<N, E> {
  private app?: Application;
  private graphContainer?: Container;
  private edgeGraphics?: Graphics;
  private nodeGraphics = new Map<string, Graphics>();
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
    this.graphContainer.addChild(this.edgeGraphics);
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
    this.positions = new Map(positions);
    this.renderEdges(edges);
    this.renderNodes(nodes, options?.nodeColorFn);
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

    const hitNode = findNodeAt(
      worldPos,
      this.currentNodes,
      this.positions,
      this.config.nodeStyle.radius
    );
    if (hitNode) return { type: 'node', node: hitNode, position: worldPos };

    const hitEdge = findEdgeAt(
      worldPos,
      this.currentEdges,
      this.positions,
      this.config.edgeStyle.width + 4
    );
    if (hitEdge) return { type: 'edge', edge: hitEdge, position: worldPos };

    return { type: 'canvas', position: worldPos };
  }

  destroy(): void {
    this.destroyed = true;
    const { app } = this;
    const { graphContainer } = this;
    const { edgeGraphics } = this;

    delete this.app;
    delete this.graphContainer;
    delete this.edgeGraphics;

    if (!app) return;

    this.unmount(app);

    for (const g of this.nodeGraphics.values()) {
      g.destroy();
    }
    this.nodeGraphics.clear();

    try {
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
    const style = this.config.edgeStyle;

    for (const edge of edges) {
      const source = this.positions.get(edge.source);
      const target = this.positions.get(edge.target);
      if (!source || !target) continue;

      this.edgeGraphics
        .moveTo(source.x, source.y)
        .lineTo(target.x, target.y)
        .stroke({ width: style.width, color: style.color, alpha: style.alpha });
    }
  }

  private renderNodes(nodes: Node<N>[], colorFn?: (node: { id: string; data: N }) => number): void {
    if (!this.graphContainer) return;

    this.removeStaleNodes(nodes);

    for (const node of nodes) {
      const pos = this.positions.get(node.id);
      if (!pos) continue;

      const graphics = this.getOrCreateNodeGraphics(node.id);
      const color = colorFn ? colorFn(node) : this.config.nodeStyle.fill;

      this.drawNode(graphics, color);
      graphics.position.set(pos.x, pos.y);
    }
  }

  private removeStaleNodes(nodes: Node<N>[]): void {
    const currentIds = new Set(nodes.map((n) => n.id));
    for (const [id, graphics] of this.nodeGraphics) {
      if (currentIds.has(id)) continue;
      this.graphContainer?.removeChild(graphics);
      graphics.destroy();
      this.nodeGraphics.delete(id);
    }
  }

  private getOrCreateNodeGraphics(id: string): Graphics {
    const existing = this.nodeGraphics.get(id);
    if (existing) return existing;

    const graphics = new Graphics();
    this.graphContainer?.addChild(graphics);
    this.nodeGraphics.set(id, graphics);
    return graphics;
  }

  private drawNode(graphics: Graphics, color: number): void {
    const style = this.config.nodeStyle;
    graphics.clear();
    graphics
      .circle(0, 0, style.radius)
      .fill({ color, alpha: style.fillAlpha })
      .stroke({
        width: style.strokeWidth,
        color: this.darkenColor(color, 0.3),
        alpha: style.strokeAlpha,
      });
  }

  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * (1 - factor));
    const g = Math.floor(((color >> 8) & 0xff) * (1 - factor));
    const b = Math.floor((color & 0xff) * (1 - factor));
    return (r << 16) | (g << 8) | b;
  }

  private applyViewport(): void {
    if (!this.graphContainer) return;
    this.graphContainer.position.set(this.viewport.x, this.viewport.y);
    this.graphContainer.scale.set(this.viewport.scale);
  }
}

export function createRenderer<N = Record<string, unknown>, E = Record<string, unknown>>(
  config?: Partial<RenderConfig>
): PixiRenderer<N, E> {
  return new PixiRenderer<N, E>(config);
}
