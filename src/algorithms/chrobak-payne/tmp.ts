import { Mesh, MeshStandardMaterial, Object3D, Scene, SphereGeometry } from 'three';
import { GraphCanonicalOrdering } from '../../graph/types/graph-canonical-ordering';
import { GraphEdge } from '../../graph/types/graph-edge';
import { GraphEmbeddingStepResult } from '../../graph/types/graph-embedding-step-result';

function chrobakPayne(edges: GraphEdge[], nodeLists: GraphCanonicalOrdering): GraphEmbeddingStepResult {
  const embeddingSteps: Record<number, [number, number]>[] = [];
  const [node0, node1, node2] = nodeLists.map(([node]) => node);
  const leftTChild: Record<number, number | null> = { [node0]: null, [node1]: null, [node2]: null };
  const rightTChild: Record<number, number | null> = { [node0]: node2, [node1]: null, [node2]: node1 };
  const horizontalOffset: Record<number, number> = { [node0]: 0, [node1]: 1, [node2]: 1 };
  const verticalCoordinate: Record<number, number> = { [node0]: 0, [node1]: 0, [node2]: 1 };

  embeddingSteps.push(computeAbsoluteSnapshot(node0, leftTChild, rightTChild, horizontalOffset, verticalCoordinate));

  // ---- Phase 1 ----
  for (let k = 3; k < nodeLists.length; k++) {
    const [currentNode, contourNeighbors] = nodeLists[k];

    const leftmostNeighbor = contourNeighbors[0];
    const leftInteriorNeighbor = contourNeighbors[1];
    const rightmostNeighbor = contourNeighbors[contourNeighbors.length - 1];
    const rightInteriorNeighbor = contourNeighbors[contourNeighbors.length - 2];
    const formsMultipleTriangles = contourNeighbors.length > 2;

    horizontalOffset[leftInteriorNeighbor] += 1;
    horizontalOffset[rightmostNeighbor] += 1;

    const sumInteriorOffsets = contourNeighbors.slice(1).reduce((sum, x) => sum + (horizontalOffset[x] || 0), 0);
    horizontalOffset[currentNode] = Math.floor((-verticalCoordinate[leftmostNeighbor] + sumInteriorOffsets + verticalCoordinate[rightmostNeighbor]) / 2);
    verticalCoordinate[currentNode] = Math.floor((verticalCoordinate[leftmostNeighbor] + sumInteriorOffsets + verticalCoordinate[rightmostNeighbor]) / 2);
    horizontalOffset[rightmostNeighbor] = sumInteriorOffsets - horizontalOffset[currentNode];

    if (formsMultipleTriangles) {
      horizontalOffset[leftInteriorNeighbor] -= horizontalOffset[currentNode];
    }

    rightTChild[leftmostNeighbor] = currentNode;
    rightTChild[currentNode] = rightmostNeighbor;
    leftTChild[currentNode] = formsMultipleTriangles ? leftInteriorNeighbor : null;

    if (formsMultipleTriangles) {
      rightTChild[rightInteriorNeighbor] = null;
    }

    embeddingSteps.push(computeAbsoluteSnapshot(node0, leftTChild, rightTChild, horizontalOffset, verticalCoordinate));
  }

  const result = convertToGraphEmbeddingStepResult(edges, embeddingSteps);
  return result;
}

function computeAbsoluteSnapshot(
  node0: number,
  leftTChild: Record<number, number | null>,
  rightTChild: Record<number, number | null>,
  horizontalOffset: Record<number, number>,
  verticalCoordinate: Record<number, number>
): Record<number, [number, number]> {
  throw new Error('Function not implemented.');
}
function convertToGraphEmbeddingStepResult(edges: GraphEdge[], embeddingSteps: Record<number, [number, number]>[]): GraphEmbeddingStepResult {
  throw new Error('Function not implemented.');
}
