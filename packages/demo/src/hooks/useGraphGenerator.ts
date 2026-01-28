import { useEffect, useRef, useState } from 'react';
import type { Edge, Node } from '@graphon/react';
import type { GeneratorWorkerResult } from '../generator.worker';
import type { EdgeData, NodeData } from '../generator';
import GeneratorWorker from '../generator.worker?worker';

interface GeneratorParams {
  nodeCount: number;
  communityCount: number;
  seed: number;
}

interface GraphGeneratorResult {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  isLoading: boolean;
}

export function useGraphGenerator(params: GeneratorParams): GraphGeneratorResult {
  const { nodeCount, communityCount, seed } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<EdgeData>[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const Ctor = GeneratorWorker as unknown as new () => Worker;
    workerRef.current = new Ctor();
    workerRef.current.onmessage = (event: MessageEvent<GeneratorWorkerResult>) => {
      setNodes(event.data.nodes);
      setEdges(event.data.edges);
      setIsLoading(false);
    };
    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    if (!workerRef.current) return;
    setIsLoading(true);
    workerRef.current.postMessage({
      type: 'generate',
      options: {
        nodeCount,
        communityCount,
        avgDegree: 6,
        intraCommunityBias: 0.92,
        triangleClosureRate: 0.5,
      },
    });
  }, [nodeCount, communityCount, seed]);

  return { nodes, edges, isLoading };
}
