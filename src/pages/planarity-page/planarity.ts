import '../../styles/themes/base.css';
import { Stepper } from '../../ui/stepper';
import { PlanarityScene } from '../../scenes/planarity-scene/planarity-scene';
import { PlanarityPageInputMode } from './planarity-page-input-mode';
import { validateMatrix } from './input-handling/planarity-page-validate-matrix';
import { parseAdjacencyList } from './input-handling/planarity-page-parse-adjacency-list';
import { parseMatrix } from './input-handling/planarity-page-parse-matrix';
import { PlanarityPageStatusMode } from './planarity-page-status-mode';

export class PlanarityPage {
  private stepper: Stepper;
  private canvas: HTMLCanvasElement;

  private planarityScene: PlanarityScene;
  private currentMode: PlanarityPageInputMode;

  private graphMatrixInput: HTMLTextAreaElement;
  private graphListInput: HTMLTextAreaElement;
  private loadGraphBtn: HTMLButtonElement;
  private statusEl: HTMLElement;

  constructor() {
    this.stepper = new Stepper();
    this.canvas = document.getElementById('viz') as HTMLCanvasElement;
    this.currentMode = 'matrix';

    this.graphMatrixInput = document.getElementById('graphMatrix')! as HTMLTextAreaElement;
    this.graphListInput = document.getElementById('graphList')! as HTMLTextAreaElement;
    this.loadGraphBtn = document.getElementById('loadGraphBtn')! as HTMLButtonElement;
    this.statusEl = document.getElementById('graphStatus')!;

    this.loadGraphBtn.addEventListener('click', this.loadGraphFromUserMatrix.bind(this));

    this.planarityScene = new PlanarityScene(this.canvas, this.showStatus.bind(this));

    const tabs = document.querySelectorAll<HTMLButtonElement>('.tabBtn');
    const modes = document.querySelectorAll<HTMLElement>('.graphMode');
    this.setupTabs(tabs, modes);

    addEventListener('resize', this.resize.bind(this));
    this.resize();

    requestAnimationFrame(this.tick.bind(this));
  }

  public async loadGraphFromUserMatrix(): Promise<void> {
    this.showStatus('', 'info');

    try {
      let matrix: number[][] = [];

      switch (this.currentMode) {
        case 'matrix':
          matrix = parseMatrix(this.graphMatrixInput.value);
          break;
        case 'list':
          matrix = parseAdjacencyList(this.graphListInput.value);
          break;
      }

      if (!validateMatrix(matrix)) {
        return;
      }

      this.planarityScene.loadGraphFromMatrix(matrix, true, 500);
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
