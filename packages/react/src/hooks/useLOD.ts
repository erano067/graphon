import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ClusterBuilderOptions,
  type ClusterHierarchy,
  DEFAULT_LOD_CONFIG,
  type GraphModel,
  type LODConfig,
  LODManager,
  type LODRenderSet,
  type PositionMap,
  buildClustersFromAttributes,
} from '@graphon/core';

export interface UseLODOptions {
  /** LOD configuration (zoom thresholds, minClusterSize, etc.) */
  config?: Partial<LODConfig>;
  /** Pre-built cluster hierarchy. If not provided, use buildHierarchy() */
  hierarchy?: ClusterHierarchy;
}

export interface UseLODResult<N, E> {
  /** Current render set based on zoom level */
  renderSet: LODRenderSet;
  /** Current LOD level (0 = most zoomed out) */
  level: number;
  /** Whether LOD is active (hierarchy is set) */
  isActive: boolean;
  /** Update zoom and get new render set. Call this when viewport.scale changes. */
  updateZoom: (zoom: number) => LODRenderSet;
  /** Check if zoom change would trigger LOD level change (useful to avoid re-renders) */
  wouldLevelChange: (zoom: number) => boolean;
  /** Build hierarchy from node attributes and activate LOD */
  buildHierarchy: (positions?: PositionMap, options?: ClusterBuilderOptions) => ClusterHierarchy;
  /** Set a pre-built hierarchy */
  setHierarchy: (hierarchy: ClusterHierarchy) => void;
  /** Clear hierarchy (disables LOD, shows all nodes) */
  clearHierarchy: () => void;
  /** Access to underlying LODManager for advanced use */
  lodManager: LODManager<N, E>;
}

/**
 * Hook for Level of Detail rendering based on zoom level.
 *
 * At low zoom (zoomed out), shows cluster super-nodes.
 * At high zoom (zoomed in), shows individual nodes.
 *
 * @example
 * ```tsx
 * function GraphWithLOD({ nodes, edges, model }) {
 *   const { renderSet, updateZoom, buildHierarchy, isActive } = useLOD(model);
 *
 *   // Build hierarchy when data loads (nodes need cluster_level_N attributes)
 *   useEffect(() => {
 *     if (nodes.length > 1000) {
 *       buildHierarchy(positions);
 *     }
 *   }, [nodes, buildHierarchy]);
 *
 *   // Update LOD when zoom changes
 *   const handleZoom = (newZoom: number) => {
 *     updateZoom(newZoom);
 *   };
 *
 *   // Use renderSet.nodes/edges for small graphs, clusters for large
 *   const nodesToRender = isActive ? renderSet.nodes : nodes.map(n => n.id);
 * }
 * ```
 */
export function useLOD<N = Record<string, unknown>, E = Record<string, unknown>>(
  model: GraphModel<N, E>,
  options?: UseLODOptions
): UseLODResult<N, E> {
  const config = useMemo(() => ({ ...DEFAULT_LOD_CONFIG, ...options?.config }), [options?.config]);
  const lodManager = useMemo(() => new LODManager<N, E>(model, config), [model, config]);
  const [renderSet, setRenderSet] = useState<LODRenderSet>(() => lodManager.getCurrentRenderSet());

  useEffect(() => {
    if (!options?.hierarchy) return;
    lodManager.setHierarchy(options.hierarchy);
    setRenderSet(lodManager.getCurrentRenderSet());
  }, [options?.hierarchy, lodManager]);

  const updateZoom = useCallback(
    (zoom: number): LODRenderSet => {
      const newRenderSet = lodManager.updateZoom(zoom);
      setRenderSet(newRenderSet);
      return newRenderSet;
    },
    [lodManager]
  );

  const wouldLevelChange = useCallback(
    (zoom: number) => lodManager.wouldLevelChange(zoom),
    [lodManager]
  );

  const buildHierarchy = useCallback(
    (positions?: PositionMap, opts?: ClusterBuilderOptions): ClusterHierarchy => {
      const hierarchy = buildClustersFromAttributes(model, {
        ...opts,
        ...(positions && { positions }),
      });
      lodManager.setHierarchy(hierarchy);
      setRenderSet(lodManager.getCurrentRenderSet());
      return hierarchy;
    },
    [model, lodManager]
  );

  const setHierarchy = useCallback(
    (hierarchy: ClusterHierarchy): void => {
      lodManager.setHierarchy(hierarchy);
      setRenderSet(lodManager.getCurrentRenderSet());
    },
    [lodManager]
  );

  const clearHierarchy = useCallback((): void => {
    lodManager.clearHierarchy();
    setRenderSet(lodManager.getCurrentRenderSet());
  }, [lodManager]);

  return {
    renderSet,
    level: renderSet.level,
    isActive: lodManager.getHierarchy() !== null,
    updateZoom,
    wouldLevelChange,
    buildHierarchy,
    setHierarchy,
    clearHierarchy,
    lodManager,
  };
}
