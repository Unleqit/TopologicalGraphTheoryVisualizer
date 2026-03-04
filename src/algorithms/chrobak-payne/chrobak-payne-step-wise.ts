export function combinatorialEmbeddingToPos2(nodeLists: [number, number[]][]): Record<number, [number, number]>[] {
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
    return steps;
  }

  const leftTChild: Record<number, number | null> = {};
  const rightTChild: Record<number, number | null> = {};
  const deltaX: Record<number, number> = {};
  const yCoordinate: Record<number, number> = {};

  const nodeList = nodeLists;

  // ---- Initialization ----
  const [v1, v2, v3] = [nodeList[0][0], nodeList[1][0], nodeList[2][0]];

  deltaX[v1] = 0;
  yCoordinate[v1] = 0;
  rightTChild[v1] = v3;
  leftTChild[v1] = null;

  deltaX[v2] = 1;
  yCoordinate[v2] = 0;
  rightTChild[v2] = null;
  leftTChild[v2] = null;

  deltaX[v3] = 1;
  yCoordinate[v3] = 1;
  rightTChild[v3] = v2;
  leftTChild[v3] = null;

  // 🔥 Capture initial triangle layout
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

    // 🔥 Capture snapshot after this insertion
    steps.push(computeAbsoluteSnapshot(v1, leftTChild, rightTChild, deltaX, yCoordinate));
  }

  return steps;
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
