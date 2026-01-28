export interface GeneratorOptions {
  nodeCount: number;
  communityCount: number;
  avgDegree: number;
  intraCommunityBias: number;
  triangleClosureRate: number;
}

export interface NodeData {
  label: string;
  community: number;
}

export interface EdgeData {
  weight: number;
}

export interface NodeState {
  id: string;
  index: number;
  community: number;
  degree: number;
  neighbors: Set<number>;
}

export const DEFAULT_OPTIONS: GeneratorOptions = {
  nodeCount: 50,
  communityCount: 4,
  avgDegree: 6,
  intraCommunityBias: 0.92,
  triangleClosureRate: 0.4,
};
