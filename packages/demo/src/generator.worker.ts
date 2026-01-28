import type { Edge, Node } from '@graphon/react';
import {
  type EdgeData,
  type GeneratorOptions,
  type NodeData,
  generateLatentSpaceNetwork,
} from './generator';

export interface GeneratorWorkerResult {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
}

export interface GeneratorWorkerMessage {
  type: 'generate';
  options: Partial<GeneratorOptions>;
}

self.onmessage = (event: MessageEvent<GeneratorWorkerMessage>) => {
  if (event.data.type === 'generate') {
    const result = generateLatentSpaceNetwork(event.data.options);
    self.postMessage(result);
  }
};
