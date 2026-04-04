import { Vector3, Mesh, CircleGeometry, MeshBasicMaterial, Line, BufferGeometry, BufferAttribute, LineBasicMaterial, Box3, Sphere, Group, Sprite } from 'three';
import { GraphEdge } from '../../../graph/types/graph-edge';
import { GraphNode } from '../../../graph/types/graph.node';
import { PlanarityPageGraphRenderingResult } from './planarity-page-graph-rendering-result';
import { createLabelSprite } from '../../utils';
import { PlanarityPageGraphNode } from './planarity-page-graph-node';
import { PlanarityPageGraphEdge } from './planarity-page-graph-edge';

export class PlanarityPageGraphRenderer {
  private onGraphRecenter: (newPosition: Vector3) => void;

  constructor(onGraphRecenter: (newPosition: Vector3) => void) {
    this.onGraphRecenter = onGraphRecenter;
  }

  public render(nodes: GraphNode[], edges: GraphEdge[], recenter: boolean = true, groupPos: Vector3 | undefined = undefined): PlanarityPageGraphRenderingResult {
    const group = new Group();
    const nodeMeshes = this.renderNodes(group, nodes);
    const nodeMap = this.buildNodeMap(nodeMeshes);
    const edgeLines = this.renderEdges(group, edges, nodeMap);

    if (recenter) {
      this.centerGroup(group);
    }

    if (groupPos) {
      group.position.set(groupPos.x, groupPos.y, groupPos.z);
    }

    return { graphGroup: group, edgeLines: edgeLines, nodeMeshes: nodeMeshes };
  }

  private buildNodeMap(nodes: PlanarityPageGraphNode[]): Map<number, Vector3> {
    const nodeMap = new Map<number, Vector3>();
    nodes.forEach((node) => nodeMap.set(Number(node.id), new Vector3(node.label.position.x, node.label.position.y, 0)));
    return nodeMap;
  }

  public addToRendering(rendering: PlanarityPageGraphRenderingResult, nodes: GraphNode[], edges: GraphEdge[]): PlanarityPageGraphRenderingResult {
    const allNodes: GraphNode[] = [...rendering.nodeMeshes.map((n) => ({ id: n.id, x: n.mesh.position.x, y: n.mesh.position.y })), ...nodes];
    const allEdges: GraphEdge[] = [...rendering.edgeLines.map((e) => e.id.split(',').map(Number) as GraphEdge), ...edges];
    return this.render(allNodes, allEdges, false, rendering.graphGroup.position);
  }

  private renderNodes(group: Group, nodes: GraphNode[]): PlanarityPageGraphNode[] {
    const nodeMeshes: PlanarityPageGraphNode[] = [];

    for (const n of nodes) {
      const pos = new Vector3(n.x, n.y, 0);

      const node = new Mesh(new CircleGeometry(0.15, 24), new MeshBasicMaterial({ color: 0x1976d2 }));
      node.position.copy(pos);
      group.add(node);

      const label = createLabelSprite(String(n.id));
      label.position.copy(pos);
      label.position.z += 0.01;
      group.add(label);

      nodeMeshes.push({ id: n.id, label: label, mesh: node });
    }
    return nodeMeshes;
  }

  private renderEdges(group: Group, edges: GraphEdge[], nodeMap: Map<number, Vector3>): PlanarityPageGraphEdge[] {
    const edgeLines: PlanarityPageGraphEdge[] = [];

    for (const [u, v] of edges) {
      const a = nodeMap.get(Number(u))!;
      const b = nodeMap.get(Number(v))!;

      const geom = new BufferGeometry();
      geom.setAttribute('position', new BufferAttribute(new Float32Array([a.x, a.y, 0, b.x, b.y, 0]), 3));

      const line = new Line(geom, new LineBasicMaterial({ color: 0x00ffcc }));
      const lineId = `${Math.min(u, v) + 0},${Math.max(u, v) + 0}`;
      group.add(line);
      edgeLines.push({ id: lineId, line: line });
    }
    return edgeLines;
  }

  protected centerGroup(group: Group): void {
    const box = new Box3().setFromObject(group);
    const sphere = box.getBoundingSphere(new Sphere());
    group.position.sub(sphere.center);
    this.onGraphRecenter(new Vector3(0, 0, sphere.radius * 3));
  }
}
