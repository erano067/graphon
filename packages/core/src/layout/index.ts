export type { Layout, LayoutType, LayoutOptions, ForceLayoutOptions } from './types';
export { DEFAULT_LAYOUT_OPTIONS, DEFAULT_FORCE_OPTIONS } from './types';
export { ForceLayout } from './ForceLayout';
export { CircularLayout } from './CircularLayout';
export { GridLayout } from './GridLayout';
export { ConcentricLayout, type ConcentricLayoutOptions } from './ConcentricLayout';
export { RadialLayout, type RadialLayoutOptions } from './RadialLayout';
export type { LayoutWorkerRequest, LayoutWorkerResult, LayoutWorkerType } from './worker';
export { LayoutWorkerCore } from './worker';

import type { ForceLayoutOptions, Layout, LayoutOptions, LayoutType } from './types';
import { ForceLayout } from './ForceLayout';
import { CircularLayout } from './CircularLayout';
import { GridLayout } from './GridLayout';
import { ConcentricLayout, type ConcentricLayoutOptions } from './ConcentricLayout';
import { RadialLayout, type RadialLayoutOptions } from './RadialLayout';

export type CreateLayoutOptions =
  | Partial<LayoutOptions>
  | Partial<ForceLayoutOptions>
  | Partial<ConcentricLayoutOptions>
  | Partial<RadialLayoutOptions>;

export function createLayout<N = Record<string, unknown>, E = Record<string, unknown>>(
  type: LayoutType,
  options?: CreateLayoutOptions,
  centerNodeId?: string
): Layout<N, E> {
  switch (type) {
    case 'force':
      return new ForceLayout<N, E>(options as Partial<ForceLayoutOptions>);
    case 'circular':
      return new CircularLayout<N, E>(options);
    case 'grid':
      return new GridLayout<N, E>(options);
    case 'concentric':
      return new ConcentricLayout<N, E>(options as Partial<ConcentricLayoutOptions>);
    case 'radial':
      return new RadialLayout<N, E>(options as Partial<RadialLayoutOptions>, centerNodeId);
    default:
      return new ForceLayout<N, E>(options as Partial<ForceLayoutOptions>);
  }
}
