import { useCallback, useMemo } from 'react';
import {
  CircularLayout,
  type Edge,
  ForceLayout,
  type ForceLayoutOptions,
  GridLayout,
  type Layout,
  type LayoutOptions,
  type LayoutType,
  type Node,
  type PositionMap,
  createLayout,
} from '@graphon/core';

export interface UseLayoutOptions {
  /** Default layout type */
  defaultType?: LayoutType;
  /** Default layout options */
  defaultOptions?: Partial<LayoutOptions | ForceLayoutOptions>;
}

export interface UseLayoutResult<N, E> {
  /** Compute positions using the specified layout algorithm */
  compute: (nodes: Node<N>[], edges: Edge<E>[], type?: LayoutType) => PositionMap;
  /** Create a layout instance for advanced use */
  createLayout: (
    type: LayoutType,
    options?: Partial<LayoutOptions | ForceLayoutOptions>
  ) => Layout<N, E>;
  /** Pre-configured ForceLayout instance */
  forceLayout: ForceLayout<N, E>;
  /** Pre-configured CircularLayout instance */
  circularLayout: CircularLayout<N, E>;
  /** Pre-configured GridLayout instance */
  gridLayout: GridLayout<N, E>;
}

/**
 * Hook for computing graph layouts.
 *
 * @example
 * ```tsx
 * function GraphWithLayouts({ nodes, edges }) {
 *   const [positions, setPositions] = useState<PositionMap>(new Map());
 *   const { compute, forceLayout } = useLayout();
 *   const { transitionTo } = useAnimation(positions, { onUpdate: render });
 *
 *   const handleForceLayout = async () => {
 *     const newPositions = compute(nodes, edges, 'force');
 *     await transitionTo(newPositions, { duration: 500 });
 *     setPositions(newPositions);
 *   };
 *
 *   const handleCircularLayout = async () => {
 *     const newPositions = compute(nodes, edges, 'circular');
 *     await transitionTo(newPositions, { duration: 300 });
 *     setPositions(newPositions);
 *   };
 * }
 * ```
 */
export function useLayout<N = Record<string, unknown>, E = Record<string, unknown>>(
  options?: UseLayoutOptions
): UseLayoutResult<N, E> {
  const defaultType = options?.defaultType ?? 'force';
  const defaultOptions = options?.defaultOptions;

  const forceLayout = useMemo(
    () => new ForceLayout<N, E>(defaultOptions as Partial<ForceLayoutOptions>),
    [defaultOptions]
  );

  const circularLayout = useMemo(() => new CircularLayout<N, E>(defaultOptions), [defaultOptions]);

  const gridLayout = useMemo(() => new GridLayout<N, E>(defaultOptions), [defaultOptions]);

  const compute = useCallback(
    (nodes: Node<N>[], edges: Edge<E>[], type?: LayoutType): PositionMap => {
      const layoutType = type ?? defaultType;
      switch (layoutType) {
        case 'force':
          return forceLayout.compute(nodes, edges);
        case 'circular':
          return circularLayout.compute(nodes, edges);
        case 'grid':
          return gridLayout.compute(nodes, edges);
        default:
          return forceLayout.compute(nodes, edges);
      }
    },
    [defaultType, forceLayout, circularLayout, gridLayout]
  );

  const createLayoutFn = useCallback(
    (type: LayoutType, opts?: Partial<LayoutOptions | ForceLayoutOptions>): Layout<N, E> => {
      return createLayout<N, E>(type, opts ?? defaultOptions);
    },
    [defaultOptions]
  );

  return {
    compute,
    createLayout: createLayoutFn,
    forceLayout,
    circularLayout,
    gridLayout,
  };
}
