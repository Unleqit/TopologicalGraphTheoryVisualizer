import * as THREE from 'three';
import { GraphNode } from '../graph/types/graph.node';
import { GraphEdge } from '../graph/types/graph-edge';
import { _3DGraphVertex } from '../graph/types/graph-3d-vertex';

export function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false, // ensures label is not hidden inside geometry
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.25, 0.25, 0.25);

  return sprite;
}

export function createLabeledVertexMeshes(mat: THREE.Material, vertices: _3DGraphVertex[], visible: boolean = false): THREE.Mesh[] {
  const vertexMeshes = [];
  for (const v of vertices) {
    vertexMeshes.push(createLabeledVertexMesh(mat, v, visible));
  }
  return vertexMeshes;
}

export function createLabeledVertexMesh(mat: THREE.Material, vertex: _3DGraphVertex, visible: boolean = false): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.05, 16, 16);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = visible;
  const label = createLabelSprite(vertex.vertex.id.toString());
  mesh.add(label);
  return mesh;
}

export function createVertexMeshes(mat: THREE.Material, vertices: _3DGraphVertex[], visible: boolean = false): THREE.Mesh[] {
  const vertexMeshes = [];
  for (const v of vertices) {
    vertexMeshes.push(createVertexMesh(mat, v, visible));
  }
  return vertexMeshes;
}

export function createVertexMesh(mat: THREE.Material, vertex: _3DGraphVertex, visible: boolean = false): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.05, 16, 16);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = visible;

  return mesh;
}

export function createEdgeLines(edges: GraphEdge[], EDGE_SEGMENTS: number, visible: boolean = false) {
  const edgeLines = [];
  for (const e of edges) {
    edgeLines.push(createEdgeLine(e, EDGE_SEGMENTS, visible));
  }
  return edgeLines;
}

export function createEdgeLine(edge: GraphEdge, EDGE_SEGMENTS: number, visible: boolean = false) {
  const points = [];
  for (let i = 0; i <= EDGE_SEGMENTS; i++) {
    points.push(new THREE.Vector3());
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff }));
  line.visible = visible;
  return line;
}

export function lerpWrap01Long(a: number, b: number, t: number): number {
  let delta = b - a;
  if (Math.abs(delta) < 0.5) {
    delta = delta > 0 ? delta - 1 : delta + 1;
  }
  let u = a + delta * t;
  if (u < 0) {
    u += 1;
  }
  if (u > 1) {
    u -= 1;
  }
  return u;
}

export function updateEdgeLine(line: THREE.Line, v0: GraphNode, v1: GraphNode, EDGE_SEGMENTS: number, morphFunction: (u: number, v: number, p: THREE.Vector3) => void) {
  const posAttr = line.geometry.attributes.position;
  for (let j = 0; j <= EDGE_SEGMENTS; j++) {
    const t = j / EDGE_SEGMENTS;
    const u = THREE.MathUtils.lerp(v0.x, v1.x, t);
    const v = THREE.MathUtils.lerp(v0.y, v1.y, t);
    const p = new THREE.Vector3();
    morphFunction(u, v, p);
    posAttr.setXYZ(j, p.x, p.y, p.z);
  }

  posAttr.needsUpdate = true;
}
