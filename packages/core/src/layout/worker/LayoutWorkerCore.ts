import type { Edge, Node, Position, PositionMap } from '../../model/types';
import type { ForceLayoutOptions, LayoutOptions } from '../types';
import { CircularLayout } from '../CircularLayout';
import { ConcentricLayout, type ConcentricLayoutOptions } from '../ConcentricLayout';
import { ForceLayout } from '../ForceLayout';
import { GridLayout } from '../GridLayout';
import { RadialLayout, type RadialLayoutOptions } from '../RadialLayout';

export type LayoutWorkerType = 'grid' | 'circular' | 'force' | 'concentric' | 'radial';

export interface LayoutWorkerRequest {
  nodes: { id: string; data: Record<string, unknown> }[];
  edges: { id: string; source: string; target: string }[];
  layoutType: LayoutWorkerType;
  options?: Partial<
    LayoutOptions | ForceLayoutOptions | ConcentricLayoutOptions | RadialLayoutOptions
  >;
  centerNodeId?: string;
}

export interface LayoutWorkerResult {
  positions: [string, Position][];
  duration: number;
}

export class LayoutWorkerCore {
  compute(request: LayoutWorkerRequest): LayoutWorkerResult {
    const startTime = performance.now();
    const nodes = request.nodes as Node[];
    const edges = request.edges as Edge[];

    let positions: PositionMap;

    switch (request.layoutType) {
      case 'grid':
        positions = new GridLayout(request.options).compute(nodes, edges);
        break;
      case 'circular':
        positions = new CircularLayout(request.options).compute(nodes, edges);
        break;
      case 'force':
        positions = new ForceLayout(request.options as Partial<ForceLayoutOptions>).compute(
          nodes,
          edges
        );
        break;
      case 'concentric':
        positions = new ConcentricLayout(
          request.options as Partial<ConcentricLayoutOptions>
        ).compute(nodes, edges);
        break;
      case 'radial':
        positions = new RadialLayout(
          request.options as Partial<RadialLayoutOptions>,
          request.centerNodeId
        ).compute(nodes, edges);
        break;
      default:
        positions = new GridLayout(request.options).compute(nodes, edges);
    }

    const duration = performance.now() - startTime;

    return {
      positions: Array.from(positions.entries()),
      duration,
    };
  }
}
