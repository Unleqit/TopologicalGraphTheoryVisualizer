import { computeGraph } from './graphWorker.js';

export function computeLayout(edges, nodeCount) {
  return computeGraph(edges, nodeCount);
}