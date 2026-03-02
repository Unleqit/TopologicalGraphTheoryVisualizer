import './base.css';
import './styles.css';

import * as THREE from 'three';
import { setupStepper } from './common.js';
import { computeLayout } from './pyodide-layout.js';

const stepper = setupStepper();
const canvas = document.getElementById('viz');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 0, 7);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(3, 4, 5);
scene.add(dir);

const objects = [];
function add(obj) {
  scene.add(obj);
  objects.push(obj);
}

/* ---------------- STEP 0 ---------------- */

const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.4, 48, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
add(sphere);

/* ---------------- STEP 1 (RAW JSON EMBEDDING) ---------------- */

const graphGroup = new THREE.Group();
graphGroup.visible = false;
add(graphGroup);

let graphData = null;

function matrixToEdgeList(matrix) {
  const n = matrix.length;
  const edges = new Array();
  for (let i = 0; i < n; ++i) {
    const row = matrix[i];
    for (let j = i + 1; j < n; ++j) {
      if (row[j] !== 0) edges.push([i, j]);
    }
  }
  return { nodeCount: n, edges };
}

async function loadGraph() {
  const diamond1 = [
    [0, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1],
    [1, 1, 0, 1, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1, 0, 1],
    [1, 1, 0, 0, 0, 1, 0],
  ];

  const { nodeCount, edges } = matrixToEdgeList(diamond1);
  const res = await computeLayout(edges, nodeCount);

  graphData = res;
  if (!graphData.planar) {
    console.warn('Graph not planar.');
    return;
  }

  renderRawGraph(graphData.nodes, graphData.edges);

  if (stepper.getStep() === 1) {
    graphGroup.visible = true;
    sphere.visible = false;
    centerGroup(graphGroup);
  }
  //  renderTutte(graphData.nodes, graphData.edges);
}

loadGraph();

/* ============================================================
   STEP 1 : Raw embedding from JSON
============================================================ */

function renderRawGraph(nodes, edges) {
  graphGroup.clear();

  const nodeMap = new Map();
  for (const n of nodes) {
    nodeMap.set(Number(n.id), new THREE.Vector3(n.x, n.y, 0));
  }

  const edgeVerts = [];
  for (const [u, v] of edges) {
    const a = nodeMap.get(Number(u));
    const b = nodeMap.get(Number(v));
    edgeVerts.push(a.x, a.y, 0, b.x, b.y, 0);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeVerts), 3));

  graphGroup.add(new THREE.LineSegments(geom, new THREE.LineBasicMaterial({ color: 0x00ffcc })));

  for (const pos of nodeMap.values()) {
    const node = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshBasicMaterial({ color: 0x1976d2 }));
    node.position.copy(pos);
    graphGroup.add(node);
  }

  // centerGroup(graphGroup);
}

/* ============================================================
   Utilities
============================================================ */

function centerGroup(group) {
  const box = new THREE.Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  group.position.sub(sphere.center);
  camera.position.set(0, 0, sphere.radius * 3);
}

/* ============================================================
   Stepper Logic
============================================================ */

const sphereCamPos = camera.position.clone();

function applyStep(s) {
  if (s === 0) {
    // sphere view
    sphere.visible = true;
    graphGroup.visible = false;

    // restore camera for sphere
    camera.position.copy(sphereCamPos);
    camera.updateProjectionMatrix();
  } else if (s === 1) {
    // graph view
    sphere.visible = false;
    graphGroup.visible = true;

    // center camera on graph when entering s = 1
    centerGroup(graphGroup);
  }
}
applyStep(stepper.getStep());

let lastStep = stepper.getStep();

/* ============================================================
   Render Loop
============================================================ */

function resize() {
  const area = document.querySelector('.canvasArea');
  const w = area.clientWidth,
    h = area.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function tick(t) {
  const s = t * 0.001;
  const cur = stepper.getStep();
  if (cur !== lastStep) {
    lastStep = cur;
    applyStep(cur);
  }

  if (sphere.visible) {
    sphere.rotation.y = s * 0.45;
    sphere.rotation.x = s * 0.2;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
