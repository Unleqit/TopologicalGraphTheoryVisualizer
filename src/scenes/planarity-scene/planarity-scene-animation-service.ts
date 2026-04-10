import { Vector3, MeshBasicMaterial, SpriteMaterial, Box3, Group, Sphere } from 'three/src/Three.Core.js';
import { PlanaritySceneGraphNode } from './types/planarity-scene-graph-node';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-scene-graph-rendering-result';
import { GraphNode } from '../../graph/types/graph.node';
import { PlanaritySceneBase } from './planarity-scene-base';
import { PlanaritySceneRenderController } from './planarity-scene-render-controller';

export class PlanaritySceneAnimationService {
  constructor(
    private readonly sceneBase: PlanaritySceneBase,
    private readonly renderController: PlanaritySceneRenderController
  ) {}

  public animateTransition(old: PlanarityPageGraphRenderingResult | undefined, _new: PlanarityPageGraphRenderingResult, msTotal: number, recenter: boolean = false): void {
    const newMap = new Map(_new.graph.nodes.map((node) => [node.id, node]));
    if (!old) {
      old = _new;
    }

    const oldMap = old.graph.nodes.length > 0 ? new Map(old.graph.nodes.map((node) => [node.id, node])) : newMap;
    const startTime = performance.now();
    const oldMeshMap = new Map(old.nodeMeshes.map((nodeMesh) => [nodeMesh.id, nodeMesh]));

    const animate = () => {
      const now = performance.now();
      const elapsedTime = now - startTime;
      const progress = Math.min(elapsedTime / msTotal, 1);

      old.graph.nodes.forEach((node) => {
        const nodeInOldRendering = oldMap.get(node.id);
        const nodeInNewRendering = newMap.get(node.id);
        const nodeMeshInOldRendering = oldMeshMap.get(node.id)!;

        if (nodeInOldRendering && nodeInNewRendering) {
          this.animateTransitionBetweenExistingVertices(
            old,
            oldMap,
            oldMeshMap,
            nodeMeshInOldRendering,
            [nodeInOldRendering.x - nodeInNewRendering.x, nodeInOldRendering.y - nodeInNewRendering.y],
            progress
          );
        } else if (nodeInOldRendering) {
          this.animateTransitionRemoveOldVertex(oldMap, nodeMeshInOldRendering, progress);
        } else if (nodeInNewRendering) {
          this.animateTransitionCreateNewVertex(oldMeshMap, nodeMeshInOldRendering, progress);
        }
      });

      if (recenter) {
        const { position, target } = this.centerGroup(_new.graphGroup);
        this.sceneBase.setCameraPosition(position);
        this.sceneBase.getCamera().lookAt(0, 0, 0);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.renderController.replaceRendering(_new, recenter);
      }
    };

    animate();
  }

  private animateTransitionBetweenExistingVertices(
    rendering: PlanarityPageGraphRenderingResult,
    oldMap: Map<number, GraphNode>,
    nodeIdMap: Map<number, PlanaritySceneGraphNode>,
    node: PlanaritySceneGraphNode,
    offset: [number, number],
    progress: number
  ): void {
    node.mesh.position.x = node.label.position.x = oldMap.get(node.id)!.x - offset[0] * progress;
    node.mesh.position.y = node.label.position.y = oldMap.get(node.id)!.y - offset[1] * progress;

    rendering.edgeLines.forEach((edge) => {
      const [aIndex, bIndex] = (edge.id as string).split(',').map(Number);

      if (aIndex !== node.id && bIndex !== node.id) {
        return;
      }

      const nodeA = nodeIdMap.get(aIndex)!.mesh;
      const nodeB = nodeIdMap.get(bIndex)!.mesh;

      if (!nodeA || !nodeB) {
        return;
      }

      const posAttr = edge.line.geometry.getAttribute('position');

      posAttr.setXYZ(0, nodeA.position.x, nodeA.position.y, nodeA.position.z);
      posAttr.setXYZ(1, nodeB.position.x, nodeB.position.y, nodeB.position.z);
      posAttr.needsUpdate = true;
    });
  }

  private animateTransitionRemoveOldVertex(oldMap: Map<number, GraphNode>, node: PlanaritySceneGraphNode, progress: number): void {
    // Use the progress to scale down the old vertex size (for fade out effect)
    const tmp = oldMap.get(node.id)!;
    const initialPosition = new Vector3(tmp.x, tmp.y, 0);
    node.mesh.position.lerp(initialPosition, 1 - progress);
    node.label.position.lerp(initialPosition, 1 - progress);

    // Gradually fade out the vertex
    (node.mesh.material as MeshBasicMaterial).opacity = 1 - progress;
    (node.label.material as SpriteMaterial).opacity = 1 - progress;

    // If progress reaches 100%, remove the vertex from the scene
    if (progress === 1) {
      node.mesh.visible = false;
      node.label.visible = false;
    }
  }

  private animateTransitionCreateNewVertex(nodeIdMap: Map<number, PlanaritySceneGraphNode>, node: PlanaritySceneGraphNode, progress: number): void {
    // Interpolate the new vertex position from the origin (or any other starting point) to the final position
    const initialPosition = new Vector3(0, 0, 0); // Assuming the new vertex starts at the origin
    const targetPosition = nodeIdMap.get(node.id)!.mesh.position;

    node.mesh.position.lerpVectors(initialPosition, targetPosition, progress);
    node.label.position.lerpVectors(initialPosition, targetPosition, progress);

    // Gradually fade in the new vertex and its label
    (node.mesh.material as MeshBasicMaterial).opacity = progress;
    (node.label.material as SpriteMaterial).opacity = progress;

    // If progress reaches 100%, make the vertex fully visible
    if (progress === 1) {
      node.mesh.visible = true;
      node.label.visible = true;
    }
  }

  private centerGroup(group: Group): { position: Vector3; target: Vector3 } {
    const box = new Box3().setFromObject(group);
    const sphere = box.getBoundingSphere(new Sphere());
    group.position.set(0, 0, 0);
    const target = new Vector3(0, 0, 0);
    const position = new Vector3(0, 0, sphere.radius * 3);
    return { position, target };
  }
}
