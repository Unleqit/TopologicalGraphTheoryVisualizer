import { matrixToEdgeList } from '../../graph/graph-utils';
import { graphLayoutService } from '../../graph/layout/index';
import { renderRawGraphStepWise } from '../../scenes/graph-scene/graph-scene';
import { combinatorialEmbeddingToPosStepWise } from '../../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { Group, PerspectiveCamera } from 'three';
import { Stepper } from '../../ui/stepper';
import { PlanarityGraphUIOptions } from './planarity-graph-ui-options';

export class PlanarityGraphUI {
  private currentMode: 'matrix' | 'list' | 'interactive' = 'matrix';
  private statusEl: HTMLElement;
  private graphMatrixInput: HTMLTextAreaElement;
  private graphListInput: HTMLTextAreaElement;
  private graphGroup: Group;
  private camera: PerspectiveCamera;
  private loadGraphBtn: HTMLButtonElement;
  private stepper: Stepper;

  constructor(opts: PlanarityGraphUIOptions) {
    this.statusEl = opts.statusEl;
    this.graphMatrixInput = opts.graphMatrixInput;
    this.graphListInput = opts.graphListInput;
    this.camera = opts.camera;
    this.graphGroup = opts.graphGroup;
    this.loadGraphBtn = opts.loadGraphBtn;
    this.stepper = opts.stepper;
    this.loadGraphBtn.addEventListener('click', this.loadGraphFromInput.bind(this));
  }

  public async loadGraphFromInput(): Promise<void> {
    this.showStatus('', 'info');

    try {
      let matrix: number[][] = [];

      switch (this.currentMode) {
        case 'matrix':
          matrix = this.parseMatrix();
          break;
        case 'list':
          matrix = this.parseAdjacencyList();
          break;
      }

      this.validateInput(matrix);
      this.showStatus('Computing layout...', 'info');

      const { nodeCount, edges } = matrixToEdgeList(matrix);
      const embeddingResult = await graphLayoutService.compute(edges, nodeCount);

      if (!embeddingResult.planar) {
        this.showStatus('Planar: ✗', 'error');
        return;
      }

      this.graphGroup.visible = true;

      const result = combinatorialEmbeddingToPosStepWise(edges, embeddingResult.canonical_ordering);
      renderRawGraphStepWise(this.graphGroup, this.camera, result, 250);

      this.stepper.setStep(1);
      this.showStatus('Planar: ✓', 'okay');
    } catch (err) {
      this.showStatus(err instanceof Error ? err.message : 'Invalid input.', 'error');
    }
  }

  private showStatus(message: string, type: 'info' | 'okay' | 'error'): void {
    this.statusEl.className = 'statusText' + (type === 'info' ? '' : type === 'okay' ? ' ok' : ' error');
    this.statusEl.textContent = message;
  }

  private parseMatrix(): number[][] {
    const text = this.graphMatrixInput.value.trim();
    if (!text) {
      throw new Error('Please enter a matrix.');
    }
    const matrix = text.split('\n').map((line) =>
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
    return matrix;
  }

  private parseAdjacencyList(): number[][] {
    const text = this.graphListInput.value.trim();
    if (!text) {
      throw new Error('Please enter an adjacency list.');
    }
    const tempMap = new Map<number, number[]>();
    const splitResult = text.split('\n');
    for (let i = 0; i < splitResult.length; ++i) {
      if (!splitResult[i]) {
        throw new Error('Invalid list format.');
      }
      const neighbors = splitResult[i]
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
      tempMap.set(i, neighbors);
    }

    const n = Math.max(...tempMap.keys()) + 1;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (const [u, neighbors] of tempMap) {
      for (const v of neighbors) {
        matrix[u][v] = 1;
        matrix[v][u] = 1;
      }
    }

    return matrix;
  }

  private validateInput(matrix: number[][]): void {
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
  }

  public setMode(mode: 'matrix' | 'list' | 'interactive'): void {
    this.currentMode = mode;
  }

  public setupTabs(tabButtons: NodeListOf<HTMLButtonElement>, modes: NodeListOf<HTMLElement>): void {
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as 'matrix' | 'list' | 'interactive';
        if (!mode) {
          return;
        }
        this.setMode(mode);
        tabButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        modes.forEach((m) => m.classList.toggle('active', m.dataset.mode === mode));
      });
    });
  }
}
