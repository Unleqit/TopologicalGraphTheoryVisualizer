import './base.css';
import './styles.css';

import * as THREE from 'three';
import { setupStepper } from './common';
import { computeLayout } from './pyodide-layout';
import { Edge, Node } from './graphWorker';

const stepper = setupStepper();
const canvas = document.getElementById('viz')!;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 0, 7);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(3, 4, 5);
scene.add(dir);

const objects = [];
function add(obj: THREE.Object3D): void {
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

function matrixToEdgeList(matrix: number[][]): { nodeCount: number; edges: [number, number][] } {
  const n = matrix.length;
  const edges: [number, number][] = [];
  for (let i = 0; i < n; ++i) {
    const row = matrix[i];
    for (let j = i + 1; j < n; ++j) {
      if (row[j] !== 0) {
        edges.push([i, j]);
      }
    }
  }
  return { nodeCount: n, edges };
}

async function loadGraph(): Promise<void> {
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

function renderRawGraph(nodes: Node[], edges: Edge[]): void {
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

function centerGroup(group: THREE.Group): void {
  const box = new THREE.Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  group.position.sub(sphere.center);
  camera.position.set(0, 0, sphere.radius * 3);
}

/* ============================================================
   Stepper Logic
============================================================ */

const sphereCamPos = camera.position.clone();

function applyStep(s: number): void {
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

function resize(): void {
  const area: HTMLCanvasElement = document.querySelector('.canvasArea')!;
  const w = area.clientWidth,
    h = area.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function tick(t: number): void {
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

const graphMatrixInput = document.getElementById('graphMatrix') as HTMLTextAreaElement;
const loadGraphBtn = document.getElementById('loadGraphBtn') as HTMLButtonElement;
const graphListInput = document.getElementById('graphList') as HTMLTextAreaElement;

const statusEl = document.getElementById('graphStatus') as HTMLElement;

loadGraphBtn.addEventListener('click', async () => {
  statusEl.textContent = '';
  statusEl.className = 'statusText';

  try {
    let matrix: number[][];

    if (currentMode === 'matrix') {
      const text = graphMatrixInput.value.trim();

      if (!text) {
        throw new Error('Please enter a matrix.');
      }

      matrix = text.split('\n').map((line) =>
        line
          .trim()
          .split(/\s+/)
          .map((v) => {
            const num = Number(v);
            if (Number.isNaN(num)) {
              throw new Error('Invalid number in matrix.');
            }
            return num;
          })
      );
    } else {
      // ===== ADJACENCY LIST MODE =====
      const text = graphListInput.value.trim();

      if (!text) {
        throw new Error('Please enter an adjacency list.');
      }

      const lines = text.split('\n');
      const tempMap = new Map<number, number[]>();

      for (const line of lines) {
        const parts = line.split(':');
        if (parts.length !== 2) {
          throw new Error('Invalid list format.');
        }

        const node = Number(parts[0].trim());
        if (Number.isNaN(node)) {
          throw new Error('Invalid node index.');
        }

        const neighbors = parts[1]
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((v) => {
            const num = Number(v);
            if (Number.isNaN(num)) {
              throw new Error('Invalid neighbor index.');
            }
            return num;
          });

        tempMap.set(node, neighbors);
      }

      const n = Math.max(...tempMap.keys()) + 1;
      matrix = Array.from({ length: n }, () => Array(n).fill(0));

      for (const [u, neighbors] of tempMap) {
        for (const v of neighbors) {
          matrix[u][v] = 1;
          matrix[v][u] = 1; // undirected
        }
      }
    }

    // ===== VALIDATION (common for both modes) =====

    const n = matrix.length;

    if (!matrix.every((row) => row.length === n)) {
      throw new Error('Matrix must be square.');
    }

    // Optional but recommended: symmetry check
    for (let i = 0; i < n; i++) {
      if (matrix[i][i] !== 0) {
        throw new Error('Diagonal must be 0.');
      }
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] !== matrix[j][i]) {
          throw new Error('Graph must be undirected (symmetric).');
        }
      }
    }

    statusEl.textContent = 'Computing layout...';

    const { nodeCount, edges } = matrixToEdgeList(matrix);
    const res = await computeLayout(edges, nodeCount);
    graphData = res;

    if (!graphData.planar) {
      statusEl.textContent = 'Planar: ✗';
      statusEl.className = 'statusText error';
      return;
    }

    // Render graph
    renderRawGraph(graphData.nodes, graphData.edges);

    sphere.visible = false;
    graphGroup.visible = true;
    centerGroup(graphGroup);
    stepper.setStep(1);

    statusEl.textContent = 'Planar: ✓';
    statusEl.className = 'statusText ok';
  } catch (err) {
    statusEl.textContent = err instanceof Error ? err.message : 'Invalid input.';
    statusEl.className = 'statusText error';
  }
});

const tabButtons = document.querySelectorAll<HTMLButtonElement>('.tabBtn');
const modes = document.querySelectorAll<HTMLElement>('.graphMode');

let currentMode: 'matrix' | 'list' = 'matrix';

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode as 'matrix' | 'list';
    if (!mode) {
      return;
    }

    currentMode = mode;

    tabButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    modes.forEach((m) => {
      m.classList.toggle('active', m.dataset.mode === mode);
    });
  });
});
