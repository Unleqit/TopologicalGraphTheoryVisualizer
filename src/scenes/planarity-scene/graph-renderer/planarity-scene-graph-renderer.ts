import { Vector3, Mesh, CircleGeometry, MeshBasicMaterial, Line, BufferGeometry, BufferAttribute, LineBasicMaterial, Box3, Sphere, Group, Sprite } from 'three';
import { GraphEdge } from '../../../graph/types/graph-edge';
import { GraphNode } from '../../../graph/types/graph.node';
import { PlanarityPageGraphRenderingResult } from './planarity-scene-graph-rendering-result';
import { createLabelSprite } from '../../utils';
import { Graph } from '../../../graph/types/graph';
import { PlanaritySceneGraphNode } from '../types/planarity-scene-graph-node';
import { PlanaritySceneGraphEdge } from '../types/planarity-scene-graph-edge';

export class PlanaritySceneGraphRenderer {
  private buildNodeMap(nodes: PlanaritySceneGraphNode[]): Map<number, Vector3> {
    const nodeMap = new Map<number, Vector3>();
    nodes.forEach((node) => nodeMap.set(Number(node.id), new Vector3(node.label.position.x, node.label.position.y, 0)));
    return nodeMap;
  }

  private renderNodes(group: Group, nodes: GraphNode[]): PlanaritySceneGraphNode[] {
    const nodeMeshes: PlanaritySceneGraphNode[] = [];

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

  private renderEdges(group: Group, edges: GraphEdge[], nodeMap: Map<number, Vector3>): PlanaritySceneGraphEdge[] {
    const edgeLines: PlanaritySceneGraphEdge[] = [];

    for (const edge of edges) {
      const u = edge.value[0];
      const v = edge.value[1];
      const a = nodeMap.get(u)!;
      const b = nodeMap.get(v)!;

      const geom = new BufferGeometry();
      geom.setAttribute('position', new BufferAttribute(new Float32Array([a.x, a.y, 0, b.x, b.y, 0]), 3));

      const line = new Line(geom, new LineBasicMaterial({ color: 0x00ffcc }));
      group.add(line);
      edgeLines.push({ id: edge.id, line: line });
    }
    return edgeLines;
  }

  private renderInternal(graph: Graph, startTimestamp: number, groupPos: Vector3 | undefined = undefined): PlanarityPageGraphRenderingResult {
    const group = new Group();
    const nodeMeshes = this.renderNodes(group, graph.nodes);
    const nodeMap = this.buildNodeMap(nodeMeshes);
    const edgeLines = this.renderEdges(group, graph.edges, nodeMap);

    if (groupPos) {
      group.position.set(groupPos.x, groupPos.y, groupPos.z);
    }

    return { startTimestamp: startTimestamp, graph: graph, graphGroup: group, edgeLines: edgeLines, nodeMeshes: nodeMeshes };
  }

  public render(graphs: Graph[], position: Vector3 | undefined = undefined): PlanarityPageGraphRenderingResult[] {
    if (graphs.length <= 0) {
      return [];
    }

    const results = [];
    const startTimestamp = Date.now();

    for (let i = 0; i < graphs.length; ++i) {
      results.push(this.renderInternal(graphs[i], startTimestamp, position));
    }
    return results;
  }
}
