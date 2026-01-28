export type { Layout, LayoutType, LayoutOptions, ForceLayoutOptions } from './types';
export { DEFAULT_LAYOUT_OPTIONS, DEFAULT_FORCE_OPTIONS } from './types';
export { ForceLayout } from './ForceLayout';
export { CircularLayout } from './CircularLayout';
export { GridLayout } from './GridLayout';

import type { ForceLayoutOptions, Layout, LayoutOptions, LayoutType } from './types';
import { ForceLayout } from './ForceLayout';
import { CircularLayout } from './CircularLayout';
import { GridLayout } from './GridLayout';

export function createLayout<N = Record<string, unknown>, E = Record<string, unknown>>(
  type: LayoutType,
  options?: Partial<LayoutOptions | ForceLayoutOptions>
): Layout<N, E> {
  switch (type) {
    case 'force':
      return new ForceLayout<N, E>(options as Partial<ForceLayoutOptions>);
    case 'circular':
      return new CircularLayout<N, E>(options);
    case 'grid':
      return new GridLayout<N, E>(options);
    default:
      return new ForceLayout<N, E>(options as Partial<ForceLayoutOptions>);
  }
}
