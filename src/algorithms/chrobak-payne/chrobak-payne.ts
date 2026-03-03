export function combinatorialEmbeddingToPos(nodeLists: [number, number[]][]): Record<number, [number, number]> {
  if (nodeLists.length < 4) {
    const defaultPositions: [number, number][] = [
      [0, 0],
      [2, 0],
      [1, 1],
    ];
    const pos: Record<number, [number, number]> = {};
    Object.keys(nodeLists).forEach((v, i) => {
      pos[parseInt(v)] = defaultPositions[i];
    });
    return pos;
  }

  // Helper dicts
  const leftTChild: Record<number, number | null> = {};
  const rightTChild: Record<number, number | null> = {};
  const deltaX: Record<number, number> = {};
  const yCoordinate: Record<number, number> = {};

  const nodeList = nodeLists;

  // Phase 1: Compute relative positions
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

  for (let k = 3; k < nodeList.length; k++) {
    const [vk, contourNeighbors] = nodeList[k];
    const wp = contourNeighbors[0];
    const wp1 = contourNeighbors[1];
    const wq = contourNeighbors[contourNeighbors.length - 1];
    const wq1 = contourNeighbors[contourNeighbors.length - 2];
    const addsMultTri = contourNeighbors.length > 2;

    // Stretch gaps
    deltaX[wp1] += 1;
    deltaX[wq] += 1;

    const deltaXWpWq = contourNeighbors.slice(1).reduce((sum: number, x: number) => sum + (deltaX[x] || 0), 0);

    // Adjust offsets
    deltaX[vk] = Math.floor((-yCoordinate[wp] + deltaXWpWq + yCoordinate[wq]) / 2);
    yCoordinate[vk] = Math.floor((yCoordinate[wp] + deltaXWpWq + yCoordinate[wq]) / 2);
    deltaX[wq] = deltaXWpWq - deltaX[vk];
    if (addsMultTri) {
      deltaX[wp1] -= deltaX[vk];
    }

    // Install vk
    rightTChild[wp] = vk;
    rightTChild[vk] = wq;
    leftTChild[vk] = addsMultTri ? wp1 : null;
    if (addsMultTri) {
      rightTChild[wq1] = null;
    }
  }

  // Phase 2: Set absolute positions
  const pos: Record<number, [number, number]> = {};
  pos[v1] = [0, yCoordinate[v1]];
  const remainingNodes: number[] = [v1];

  function setPosition(
    parentNode: number,
    childDict: Record<number, number | null>,
    remaining: number[],
    deltaX: Record<number, number>,
    yCoordinate: Record<number, number>,
    pos: Record<number, [number, number]>
  ): void {
    const child = childDict[parentNode];
    if (child != null) {
      pos[child] = [pos[parentNode][0] + deltaX[child], yCoordinate[child]];
      remaining.push(child);
    }
  }

  while (remainingNodes.length > 0) {
    const parentNode = remainingNodes.pop()!;
    setPosition(parentNode, leftTChild, remainingNodes, deltaX, yCoordinate, pos);
    setPosition(parentNode, rightTChild, remainingNodes, deltaX, yCoordinate, pos);
  }

  return pos;
}
