import { Stepper } from '../../ui/stepper';
import { PlanarityScene } from '../../scenes/planarity-scene/planarity-scene';
import { PlanarityPageInputMode } from './planarity-page-input-mode';
import { validateMatrix } from './input-handling/planarity-page-input-validator';
import { PlanarityPageStatusMode } from './planarity-page-status-mode';
import { Graph } from '../../graph/types/graph';
import { PlanarityPageInputConverter } from './input-handling/planarity-page-input-converter';
import { PlanarityPageInputParser } from './input-handling/planarity-page-input-parser';
import { PlanarityPageInputMatrix } from './input-handling/planarity-page-input-matrix';

export class PlanarityPage {
  private stepper: Stepper;
  private canvas: HTMLCanvasElement;
  private planarityScene: PlanarityScene;
  private currentMode: PlanarityPageInputMode;
  private graphMatrixInput: HTMLTextAreaElement;
  private graphListInput: HTMLTextAreaElement;
  private loadGraphBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private statusEl: HTMLElement;
  private inputConverter: PlanarityPageInputConverter;
  private inputParser: PlanarityPageInputParser;

  constructor() {
    this.stepper = new Stepper();
    this.canvas = document.getElementById('viz') as HTMLCanvasElement;
    this.currentMode = 'matrix';
    this.graphMatrixInput = document.getElementById('graphMatrix')! as HTMLTextAreaElement;
    this.graphListInput = document.getElementById('graphList')! as HTMLTextAreaElement;
    this.clearBtn = document.getElementById('clearBtn')! as HTMLButtonElement;
    this.loadGraphBtn = document.getElementById('loadGraphBtn')! as HTMLButtonElement;
    this.statusEl = document.getElementById('graphStatus')!;
    this.loadGraphBtn.addEventListener('click', this.loadGraphFromUserMatrix.bind(this));
    this.inputConverter = new PlanarityPageInputConverter();
    this.inputParser = new PlanarityPageInputParser();
    this.planarityScene = new PlanarityScene(this.canvas, this.showStatus.bind(this), this.updateGraphRepresentation.bind(this));
    this.clearBtn.addEventListener('click', this.planarityScene.clear.bind(this.planarityScene));

    const tabs = document.querySelectorAll<HTMLButtonElement>('.tabBtn');
    const modes = document.querySelectorAll<HTMLElement>('.graphMode');
    this.setupTabs(tabs, modes);

    addEventListener('resize', this.resize.bind(this));
    this.resize();

    requestAnimationFrame(this.tick.bind(this));

    window.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.key === 'z') {
        this.planarityScene.undo();
      }
      if ((isCmdOrCtrl && e.key === 'y') || (isCmdOrCtrl && e.key === 'z' && e.shiftKey)) {
        this.planarityScene.redo();
      }
    });

    //change this if default graph is not planar
    this.showStatus('Checking planarity... ✓', 'okay');
  }

  public async loadGraphFromUserMatrix(): Promise<void> {
    this.showStatus('', 'info');

    try {
      let inputMatrix: PlanarityPageInputMatrix = [];

      switch (this.currentMode) {
        case 'matrix':
          inputMatrix = this.inputParser.rawMatrixToInputMatrix(this.graphMatrixInput.value);
          break;
        case 'list':
          inputMatrix = this.inputParser.rawAdjacencyListToInputMatrix(this.graphListInput.value);
          break;
      }

      if (!validateMatrix(inputMatrix)) {
        return;
      }

      const graph = this.inputConverter.inputMatrixToGraph(inputMatrix);
      this.planarityScene.loadGraph(graph, true, 500);
    } catch (error: any) {
      this.showStatus(error.message, 'error');
    }
  }

  private resize(): void {
    const area = document.querySelector('.canvasArea')!;
    this.planarityScene.resize(area.clientWidth, area.clientHeight);
  }

  private tick(): void {
    this.planarityScene.update();
    requestAnimationFrame(this.tick.bind(this));
  }

  private showStatus(message: string, type: PlanarityPageStatusMode): void {
    this.statusEl.className = 'statusText' + (type === 'info' ? '' : type === 'okay' ? ' ok' : ' error');
    this.statusEl.textContent = message;
    this.loadGraphBtn.disabled = type !== 'okay';
  }

  private updateGraphRepresentation(graph: Graph): void {
    const inputMatrix = this.inputConverter.graphToInputMatrix(graph);
    const rawMatrix = this.inputParser.inputMatrixToRawMatrix(inputMatrix);
    const rawAdjacencyList = this.inputParser.inputMatrixToRawAdjacencyList(inputMatrix);
    this.graphMatrixInput.value = rawMatrix;
    this.graphListInput.value = rawAdjacencyList;
    //update overlays
    this.graphMatrixInput.dispatchEvent(new Event('input'));
    this.graphListInput.dispatchEvent(new Event('input'));
  }

  public setMode(mode: PlanarityPageInputMode): void {
    this.currentMode = mode;
  }

  public setupTabs(tabButtons: NodeListOf<HTMLButtonElement>, modes: NodeListOf<HTMLElement>): void {
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as PlanarityPageInputMode;
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
new PlanarityPage();
