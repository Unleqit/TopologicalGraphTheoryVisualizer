import { GraphNode } from '../graph/types/graph.node';
import { GraphEdge } from '../graph/types/graph-edge';
import { _3DGraphVertex } from '../graph/types/graph-3d-vertex';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { Sprite, CanvasTexture, SpriteMaterial, Material, Mesh, SphereGeometry, Line, Vector3, MathUtils } from 'three';

export function createLabelSprite(text: string, colorString: string = 'rgba(0,0,0,0.6)'): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = colorString;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new CanvasTexture(canvas);

  const material = new SpriteMaterial({ map: texture, transparent: true, depthTest: false });

  const sprite = new Sprite(material);
  sprite.scale.set(0.25, 0.25, 0.25);

  return sprite;
}

export function createLabeledVertexMeshes(mat: Material, vertices: _3DGraphVertex[], visible: boolean = false): Mesh[] {
  const vertexMeshes = [];
  for (const v of vertices) {
    vertexMeshes.push(createLabeledVertexMesh(mat, v.vertex.id.toString(), visible));
  }
  return vertexMeshes;
}

export function createLabeledVertexMesh(mat: Material, vertexID: string, visible: boolean = false): Mesh {
  const geo = new SphereGeometry(0.05, 16, 16);
  const mesh = new Mesh(geo, mat);
  mesh.visible = visible;
  const label = createLabelSprite(vertexID);
  mesh.add(label);
  return mesh;
}

export function createVertexMeshes(mat: Material, vertices: _3DGraphVertex[], visible: boolean = false): Mesh[] {
  const vertexMeshes = [];
  for (const v of vertices) {
    vertexMeshes.push(createVertexMesh(mat, visible));
  }
  return vertexMeshes;
}

export function createVertexMesh(mat: Material, visible: boolean = false): Mesh {
  const geo = new SphereGeometry(0.05, 16, 16);
  const mesh = new Mesh(geo, mat);
  mesh.visible = visible;
  return mesh;
}

export function createEdgeLines(edges: GraphEdge[], EDGE_SEGMENTS: number, visible: boolean = false): Line2[] {
  const edgeLines = [];
  for (const e of edges) {
    edgeLines.push(createEdgeLine(EDGE_SEGMENTS, visible));
  }
  return edgeLines;
}

export function createEdgeLine(EDGE_SEGMENTS: number, visible: boolean = false): Line2 {
  const positions: number[] = [];

  for (let i = 0; i <= EDGE_SEGMENTS; i++) {
    positions.push(0, 0, 0);
  }

  const geometry = new LineGeometry();
  geometry.setPositions(positions);

  const material = new LineMaterial({ color: 0x00ffff, linewidth: 3 });
  material.resolution.set(window.innerWidth, window.innerHeight);

  window.addEventListener('resize', () => {
    material.resolution.set(window.innerWidth, window.innerHeight);
  });

  const line = new Line2(geometry, material);
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

export function updateEdgeLine(line: Line, v0: GraphNode, v1: GraphNode, EDGE_SEGMENTS: number, morphFunction: (u: number, v: number, p: Vector3) => void) {
  const posAttr = line.geometry.attributes.position;
  for (let j = 0; j <= EDGE_SEGMENTS; j++) {
    const t = j / EDGE_SEGMENTS;
    const u = MathUtils.lerp(v0.x, v1.x, t);
    const v = MathUtils.lerp(v0.y, v1.y, t);
    const p = new Vector3();
    morphFunction(u, v, p);
    posAttr.setXYZ(j, p.x, p.y, p.z);
  }

  posAttr.needsUpdate = true;
}
