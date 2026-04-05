import { Graph } from '../../graph/types/graph';
import { GraphCanonicalOrdering } from '../../graph/types/graph-canonical-ordering';
import { GraphEdge } from '../../graph/types/graph-edge';
import { GraphEmbeddingStepResult } from '../../graph/types/graph-embedding-step-result';
import { GraphNode } from '../../graph/types/graph.node';

export function combinatorialEmbeddingToPosStepWise(edges: GraphEdge[], nodeLists: GraphCanonicalOrdering): GraphEmbeddingStepResult {
  const steps: Record<number, [number, number]>[] = [];

  if (nodeLists.length < 4) {
    const defaultPositions: [number, number][] = [
      [0, 0],
      [2, 0],
      [1, 1],
    ];

    const pos: Record<number, [number, number]> = {};
    nodeLists.forEach(([node], i) => {
      pos[node] = defaultPositions[i];
    });

    steps.push({ ...pos });
    const result = steps2GraphEmbeddingStepResult(edges, steps);
    return result;
  }

  const nodeList = nodeLists;

  // ---- Initialization ----
  const [v1, v2, v3] = nodeLists.map(([node]) => node);

  const leftTChild: Record<number, number | null> = { [v1]: null, [v2]: null, [v3]: null };
  const rightTChild: Record<number, number | null> = { [v1]: v3, [v2]: null, [v3]: v2 };
  const deltaX: Record<number, number> = { [v1]: 0, [v2]: 1, [v3]: 1 };
  const yCoordinate: Record<number, number> = { [v1]: 0, [v2]: 0, [v3]: 1 };

  steps.push(computeAbsoluteSnapshot(v1, leftTChild, rightTChild, deltaX, yCoordinate));

  // ---- Phase 1 ----
  for (let k = 3; k < nodeList.length; k++) {
    const [vk, contourNeighbors] = nodeList[k];

    const wp = contourNeighbors[0];
    const wp1 = contourNeighbors[1];
    const wq = contourNeighbors[contourNeighbors.length - 1];
    const wq1 = contourNeighbors[contourNeighbors.length - 2];
    const addsMultTri = contourNeighbors.length > 2;

    deltaX[wp1] += 1;
    deltaX[wq] += 1;

    const deltaXWpWq = contourNeighbors.slice(1).reduce((sum, x) => sum + (deltaX[x] || 0), 0);

    deltaX[vk] = Math.floor((-yCoordinate[wp] + deltaXWpWq + yCoordinate[wq]) / 2);

    yCoordinate[vk] = Math.floor((yCoordinate[wp] + deltaXWpWq + yCoordinate[wq]) / 2);

    deltaX[wq] = deltaXWpWq - deltaX[vk];

    if (addsMultTri) {
      deltaX[wp1] -= deltaX[vk];
    }

    rightTChild[wp] = vk;
    rightTChild[vk] = wq;
    leftTChild[vk] = addsMultTri ? wp1 : null;

    if (addsMultTri) {
      rightTChild[wq1] = null;
    }

    steps.push(computeAbsoluteSnapshot(v1, leftTChild, rightTChild, deltaX, yCoordinate));
  }

  const result = steps2GraphEmbeddingStepResult(edges, steps);
  return result;
}

function steps2GraphEmbeddingStepResult(edges: GraphEdge[], steps: Record<number, [number, number]>[]): GraphEmbeddingStepResult {
  const nodeSteps = steps.map((step) => Object.entries(step).map(([id, [x, y]]): GraphNode => ({ id: parseInt(id), x, y })));
  const edgeSteps = nodeSteps.map((nodes) => {
    const idSet = new Set(nodes.map((n) => n.id));
    return edges.filter(([u, v]) => idSet.has(u) && idSet.has(v));
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const graphs = Array.from({ length: nodeSteps.length }, (_nodes, k: number): Graph => ({ nodes: nodeSteps[k], edges: edgeSteps[k] }));
  return { planar: true, graphs: graphs };
}

function computeAbsoluteSnapshot(
  root: number,
  leftTChild: Record<number, number | null>,
  rightTChild: Record<number, number | null>,
  deltaX: Record<number, number>,
  yCoordinate: Record<number, number>
): Record<number, [number, number]> {
  const pos: Record<number, [number, number]> = {};
  pos[root] = [0, yCoordinate[root]];

  const stack: number[] = [root];

  while (stack.length > 0) {
    const parent = stack.pop()!;

    const left = leftTChild[parent];
    const right = rightTChild[parent];

    if (left != null) {
      pos[left] = [pos[parent][0] + deltaX[left], yCoordinate[left]];
      stack.push(left);
    }

    if (right != null) {
      pos[right] = [pos[parent][0] + deltaX[right], yCoordinate[right]];
      stack.push(right);
    }
  }

  // Return deep copy to freeze snapshot
  return Object.fromEntries(Object.entries(pos).map(([k, v]) => [Number(k), [...v] as [number, number]]));
}
