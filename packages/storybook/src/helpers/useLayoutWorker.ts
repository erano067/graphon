import { useCallback, useEffect, useRef, useState } from 'react';
import * as Comlink from 'comlink';
import type { Edge, LayoutWorkerCore, LayoutWorkerType, Node, Position } from '@graphon/core';
import LayoutWorker from '../layout.worker?worker';

export interface UseLayoutWorkerOptions {
  width?: number;
  height?: number;
  padding?: number;
  iterations?: number;
  centerNodeId?: string;
}

export interface UseLayoutWorkerResult {
  positions: Map<string, Position>;
  isComputing: boolean;
  duration: number;
  compute: (
    nodes: Node<unknown>[],
    edges: Edge<unknown>[],
    layoutType: LayoutWorkerType,
    options?: UseLayoutWorkerOptions
  ) => Promise<void>;
}

export function useLayoutWorker(): UseLayoutWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<LayoutWorkerCore> | null>(null);
  const [positions, setPositions] = useState<Map<string, Position>>(new Map());
  const [isComputing, setIsComputing] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const worker = new (LayoutWorker as new () => Worker)();
    workerRef.current = worker;
    apiRef.current = Comlink.wrap<LayoutWorkerCore>(worker);

    return () => {
      worker.terminate();
    };
  }, []);

  const compute = useCallback(
    async (
      nodes: Node<unknown>[],
      edges: Edge<unknown>[],
      layoutType: LayoutWorkerType,
      options: UseLayoutWorkerOptions = {}
    ): Promise<void> => {
      if (!apiRef.current) return;

      setIsComputing(true);

      const result = await apiRef.current.compute({
        nodes: nodes.map((n) => ({ id: n.id, data: n.data as Record<string, unknown> })),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
        layoutType,
        options: {
          width: options.width ?? 800,
          height: options.height ?? 600,
          padding: options.padding ?? 50,
          ...(options.iterations !== undefined && { iterations: options.iterations }),
        },
        ...(options.centerNodeId && { centerNodeId: options.centerNodeId }),
      });

      setPositions(new Map(result.positions));
      setDuration(result.duration);
      setIsComputing(false);
    },
    []
  );

  return { positions, isComputing, duration, compute };
}
