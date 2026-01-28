import { shuffleArray } from './utils';

export function assignCommunities(nodeCount: number, communityCount: number): number[] {
  const sizes = generateCommunitySizes(nodeCount, communityCount);
  return shuffleAssignments(sizes, communityCount);
}

function generateCommunitySizes(nodeCount: number, communityCount: number): number[] {
  const minPerCommunity = 2;
  const rawWeights = Array.from({ length: communityCount }, () => Math.pow(Math.random(), -1.5));
  const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
  const distributable = nodeCount - minPerCommunity * communityCount;

  const sizes = rawWeights.map((w) =>
    Math.max(minPerCommunity, Math.floor(minPerCommunity + (w / totalWeight) * distributable))
  );

  adjustForRoundingErrors(sizes, nodeCount, communityCount, minPerCommunity);
  return sizes;
}

function adjustForRoundingErrors(
  sizes: number[],
  nodeCount: number,
  communityCount: number,
  minPerCommunity: number
): void {
  let total = sizes.reduce((a, b) => a + b, 0);

  while (total < nodeCount) {
    sizes[Math.floor(Math.random() * communityCount)]++;
    total++;
  }

  while (total > nodeCount) {
    const idx = sizes.findIndex((s) => s > minPerCommunity);
    if (idx < 0) break;
    sizes[idx]--;
    total--;
  }
}

function shuffleAssignments(sizes: number[], communityCount: number): number[] {
  const assignments: number[] = [];
  for (let c = 0; c < communityCount; c++) {
    for (let i = 0; i < sizes[c]; i++) {
      assignments.push(c);
    }
  }
  return shuffleArray(assignments);
}
