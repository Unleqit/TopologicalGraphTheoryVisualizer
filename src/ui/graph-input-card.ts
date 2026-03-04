import * as THREE from 'three';
import { GraphEmbeddingResult } from '../graph/graph-embedding-result';
import { matrixToEdgeList } from '../graph/graph-utils';
import { graphLayoutService } from '../layout/index';
import { renderRawGraph, renderRawGraphStepWise } from '../scenes/graph-scene';
import { centerGroup } from '../threejs/camera';
import { combinatorialEmbeddingToPos } from '../algorithms/chrobak-payne/chrobak-payne';
import { GraphNode } from '../graph/graph.node';
import { combinatorialEmbeddingToPosStepWise } from '../algorithms/chrobak-payne/chrobak-payne-step-wise';

export interface GraphUIOptions {
  graphMatrixInput: HTMLTextAreaElement;
  graphListInput: HTMLTextAreaElement;
  loadGraphBtn: HTMLButtonElement;
  statusEl: HTMLElement;
  graphGroup: THREE.Group;
  sphere: THREE.Object3D;
  camera: THREE.PerspectiveCamera;
  stepper: ReturnType<typeof import('./setup-stepper').setupStepper>;
}

export function setupGraphUI(opts: GraphUIOptions): { setMode: (mode: 'matrix' | 'list') => 'matrix' | 'list'; getGraphData: () => GraphEmbeddingResult | null } {
  let currentMode: 'matrix' | 'list' = 'matrix';
  const graphData: GraphEmbeddingResult | null = null;

  async function loadGraphFromInput(): Promise<void> {
    opts.statusEl.textContent = '';
    opts.statusEl.className = 'statusText';

    try {
      let matrix: number[][];

      if (currentMode === 'matrix') {
        const text = opts.graphMatrixInput.value.trim();
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
        const text = opts.graphListInput.value.trim();
        if (!text) {
          throw new Error('Please enter an adjacency list.');
        }
        const tempMap = new Map<number, number[]>();
        for (const line of text.split('\n')) {
          const [nodeStr, neighborsStr] = line.split(':');
          if (!neighborsStr) {
            throw new Error('Invalid list format.');
          }
          const node = Number(nodeStr.trim());
          if (Number.isNaN(node)) {
            throw new Error('Invalid node index.');
          }
          const neighbors = neighborsStr
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
            matrix[v][u] = 1;
          }
        }
      }

      const n = matrix.length;
      if (!matrix.every((row) => row.length === n)) {
        throw new Error('Matrix must be square.');
      }
      for (let i = 0; i < n; i++) {
        if (matrix[i][i] !== 0) {
          throw new Error('Diagonal must be 0.');
        }
        for (let j = 0; j < n; j++) {
          if (matrix[i][j] !== matrix[j][i]) {
            throw new Error('Graph must be undirected.');
          }
        }
      }

      opts.statusEl.textContent = 'Computing layout...';
      const { nodeCount, edges } = matrixToEdgeList(matrix);
      const layout = await graphLayoutService.compute(edges, nodeCount);

      if (!layout.planar) {
        opts.statusEl.textContent = 'Planar: ✗';
        opts.statusEl.className = 'statusText error';
        return;
      }

      opts.sphere.visible = false;
      opts.graphGroup.visible = true;

      const result = combinatorialEmbeddingToPosStepWise(edges, layout.canonical_ordering);
      renderRawGraphStepWise(opts.graphGroup, opts.camera, result, 250);

      opts.stepper.setStep(1);
      opts.statusEl.textContent = 'Planar: ✓';
      opts.statusEl.className = 'statusText ok';
    } catch (err) {
      opts.statusEl.textContent = err instanceof Error ? err.message : 'Invalid input.';
      opts.statusEl.className = 'statusText error';
    }
  }

  opts.loadGraphBtn.addEventListener('click', loadGraphFromInput);

  return {
    setMode: (mode: 'matrix' | 'list') => (currentMode = mode),
    getGraphData: () => graphData,
  };
}

export function setupTabs(tabButtons: NodeListOf<HTMLButtonElement>, modes: NodeListOf<HTMLElement>, setMode: (mode: 'matrix' | 'list') => void): void {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode as 'matrix' | 'list';
      if (!mode) {
        return;
      }
      setMode(mode);
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      modes.forEach((m) => m.classList.toggle('active', m.dataset.mode === mode));
    });
  });
}
