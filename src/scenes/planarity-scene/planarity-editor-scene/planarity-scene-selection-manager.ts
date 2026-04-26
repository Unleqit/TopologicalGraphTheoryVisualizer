import { Color, LineBasicMaterial, MeshBasicMaterial } from 'three';
import { PlanaritySceneGraphEdge } from './types/planarity-scene-graph-edge';
import { PlanaritySceneGraphNode } from './types/planarity-scene-graph-node';

export class PlanaritySceneSelectionManager {
  private currentlySelectedVertex: PlanaritySceneGraphNode | undefined;
  private currentlySelectedEdge: PlanaritySceneGraphEdge | undefined;

  constructor(
    private readonly vertexSelectionColor: number = 0xffff00,
    private readonly edgeSelectionColor: number = 0xffff00
  ) {}

  public deselectSelection(): void {
    if (this.currentlySelectedVertex) {
      this.deselectVertex(this.currentlySelectedVertex);
    }
    if (this.deselectEdge) {
      this.deselectEdge(this.currentlySelectedEdge);
    }
  }

  public getVertexSelection(): PlanaritySceneGraphNode | undefined {
    return this.currentlySelectedVertex;
  }

  public getEdgeSelection(): PlanaritySceneGraphEdge | undefined {
    return this.currentlySelectedEdge;
  }

  public getSelection(): [PlanaritySceneGraphNode | undefined, PlanaritySceneGraphEdge | undefined] {
    return [this.currentlySelectedVertex, this.currentlySelectedEdge];
  }

  public selectVertex(node: PlanaritySceneGraphNode): void {
    this.deselectSelection();
    this.currentlySelectedVertex = node;
    const material = node.mesh.material as MeshBasicMaterial;
    node.mesh.userData.originalColor = material.color.clone();
    material.color.set(this.vertexSelectionColor);
  }

  public deselectVertex(node: PlanaritySceneGraphNode | undefined): void {
    if (node) {
      const material = node.mesh.material as LineBasicMaterial;
      const originalColor = node.mesh.userData.originalColor as Color;
      if (originalColor) {
        material.color.copy(originalColor);
      }
      this.currentlySelectedVertex = undefined;
    }
  }

  public selectEdge(edge: PlanaritySceneGraphEdge): void {
    this.deselectSelection();
    this.currentlySelectedEdge = edge;
    const material = edge.line.material as LineBasicMaterial;
    edge.line.userData.originalColor = material.color.clone();
    material.color.set(this.edgeSelectionColor);
  }

  public deselectEdge(edge: PlanaritySceneGraphEdge | undefined): void {
    if (edge) {
      const material = edge.line.material as LineBasicMaterial;
      const originalColor = edge.line.userData.originalColor as Color;
      if (originalColor) {
        material.color.copy(originalColor);
      }
      this.currentlySelectedEdge = undefined;
    }
  }
}
