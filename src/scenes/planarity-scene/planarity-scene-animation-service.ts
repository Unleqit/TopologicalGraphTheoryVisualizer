import { Vector3, MeshBasicMaterial, SpriteMaterial, Box3, Group, Sphere } from 'three';
import { PlanaritySceneGraphNode } from './types/planarity-scene-graph-node';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-scene-graph-rendering-result';
import { GraphNode } from '../../graph/types/graph.node';
import { PlanaritySceneBase } from './planarity-scene-base';
import { PlanaritySceneRenderController } from './planarity-scene-render-controller';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

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
    let renderingReplaced = false;

    const oldMap = old.graph.nodes.length > 0 ? new Map(old.graph.nodes.map((node) => [node.id, node])) : newMap;
    const startTime = performance.now();
    const oldMeshMap = new Map(old.nodeMeshes.map((nodeMesh) => [nodeMesh.id, nodeMesh]));
    const newMeshMap = new Map(_new.nodeMeshes.map((nodeMesh) => [nodeMesh.id, nodeMesh]));

    const animate = () => {
      const now = performance.now();
      const elapsedTime = now - startTime;
      const progress = Math.min(elapsedTime / msTotal, 1);
      const allNodeIds = new Set([...old.graph.nodes.map((node) => node.id), ..._new.graph.nodes.map((node) => node.id)]);

      allNodeIds.forEach((id) => {
        const nodeInOldRendering = oldMap.get(id);
        const nodeInNewRendering = newMap.get(id);
        const nodeMeshInOldRendering = oldMeshMap.get(id)!;
        const nodeMeshInNewRendering = newMeshMap.get(id)!;

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
          this.animateTransitionRemoveOldVertex(old, oldMeshMap, nodeMeshInOldRendering, progress);
        } else if (nodeInNewRendering) {
          renderingReplaced = true;
          this.animateTransitionCreateNewVertex(_new, recenter, newMeshMap, nodeMeshInNewRendering, progress);
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
        if (!renderingReplaced) {
          this.renderController.replaceRendering(_new, recenter);
        }
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

  private animateTransitionRemoveOldVertex(
    rendering: PlanarityPageGraphRenderingResult,
    nodeIdMap: Map<number, PlanaritySceneGraphNode>,
    node: PlanaritySceneGraphNode,
    progress: number
  ): void {
    (node.mesh.material as MeshBasicMaterial).opacity = 1 - progress;
    (node.label.material as SpriteMaterial).opacity = 1 - progress;

    if (progress === 1) {
      node.mesh.visible = false;
      node.label.visible = false;
    }

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
      (edge.line.material as LineMaterial).opacity = 1 - progress;
    });
  }

  private animateTransitionCreateNewVertex(
    _new: PlanarityPageGraphRenderingResult,
    recenter: boolean,
    nodeIdMap: Map<number, PlanaritySceneGraphNode>,
    node: PlanaritySceneGraphNode,
    progress: number
  ): void {
    const meshMaterial = node.mesh.material as MeshBasicMaterial;
    const labelMaterial = node.label.material as SpriteMaterial;

    if (!node.mesh.userData.beganRendering) {
      node.mesh.visible = false;
      node.label.visible = false;
      meshMaterial.opacity = 0;
      labelMaterial.opacity = 0;
      this.renderController.replaceRendering(_new, recenter);
      node.mesh.visible = true;
      node.label.visible = true;
      node.mesh.userData.beganRendering = true;
    }

    meshMaterial.opacity = progress;
    labelMaterial.opacity = progress;

    _new.edgeLines.forEach((edge) => {
      const [aIndex, bIndex] = (edge.id as string).split(',').map(Number);
      if (aIndex !== node.id && bIndex !== node.id) {
        return;
      }
      const nodeA = nodeIdMap.get(aIndex)!.mesh;
      const nodeB = nodeIdMap.get(bIndex)!.mesh;
      if (!nodeA || !nodeB) {
        return;
      }
      (edge.line.material as LineMaterial).opacity = 1 - progress;
    });
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
