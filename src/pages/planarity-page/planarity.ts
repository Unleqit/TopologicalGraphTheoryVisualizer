import { PlanarityScene } from '../../scenes/planarity-scene/planarity-testing-editor-scene/planarity-scene';
import { PlanarityPageInputMode } from './planarity-page-input-mode';
import { validateMatrix } from './input-handling/planarity-page-input-validator';
import { PlanarityPageStatusMode } from './planarity-page-status-mode';
import { Graph } from '../../graph/types/graph';
import { PlanarityPageInputConverter } from './input-handling/planarity-page-input-converter';
import { PlanarityPageInputParser } from './input-handling/planarity-page-input-parser';
import { PlanarityPageInputMatrix } from './input-handling/planarity-page-input-matrix';
import { GraphEmbeddingPythonResult } from '../../graph/types/graph-embedding-python-result';
import { Stepper } from '../../ui/setup-stepper';
import { PlanaritySceneBase } from '../../scenes/planarity-scene/planarity-testing-editor-scene/planarity-scene-base';
import { Vector3 } from 'three';
import { PlanarityConditionScene } from '../../scenes/planarity-scene/planarity-condition-scene/planarity-condition-scene';
import { PlanarityTestingScene } from '../../scenes/planarity-scene/planarity-testing-scene';
import { PlanarityEulersFormulaScene } from '../../scenes/planarity-scene/planarity-eulers-formula-scene';
import { PlanarityEmbeddingScene } from '../../scenes/planarity-scene/planarity-embedding-scene';

export class PlanarityPage {
  private stepper: Stepper;
  private canvas: HTMLCanvasElement;
  private currentMode: PlanarityPageInputMode;
  private graphMatrixInput: HTMLTextAreaElement;
  private graphListInput: HTMLTextAreaElement;
  private loadGraphBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private statusEl: HTMLElement;
  private inputConverter: PlanarityPageInputConverter;
  private inputParser: PlanarityPageInputParser;
  private currentGraph: Graph | undefined;
  private currentEmbeddingResult: GraphEmbeddingPythonResult | undefined;
  private graphInputCard: HTMLElement;
  private graphActions: HTMLElement;

  private lastStep: number = -1;
  private planarityScenes: PlanaritySceneBase[];
  private lastScene: PlanarityScene;

  constructor() {
    this.stepper = new Stepper();
    this.canvas = document.getElementById('viz') as HTMLCanvasElement;
    this.currentMode = 'matrix';
    this.graphMatrixInput = document.getElementById('graphMatrix')! as HTMLTextAreaElement;
    this.graphListInput = document.getElementById('graphList')! as HTMLTextAreaElement;
    this.clearBtn = document.getElementById('clearBtn')! as HTMLButtonElement;
    this.loadGraphBtn = document.getElementById('loadGraphBtn')! as HTMLButtonElement;
    this.statusEl = document.getElementById('graphStatus')!;
    this.graphInputCard = document.getElementById('graphInputCard') as HTMLElement;
    this.graphActions = document.getElementById('graphActions') as HTMLElement;

    this.graphMatrixInput.addEventListener('input', this.checkPlanarityOfUserInputGraph.bind(this));
    this.graphListInput.addEventListener('input', this.checkPlanarityOfUserInputGraph.bind(this));
    this.loadGraphBtn.addEventListener('click', this.computePlanarDrawingForInputGraph.bind(this));

    this.planarityScenes = [
      new PlanarityConditionScene(this.canvas),
      new PlanarityEulersFormulaScene(this.canvas),
      new PlanarityTestingScene(this.canvas),
      new PlanarityEmbeddingScene(this.canvas),
      new PlanarityScene(this.canvas, this.showStatus.bind(this), this.updateGraphRepresentation.bind(this)),
    ];
    this.lastScene = this.planarityScenes[this.planarityScenes.length - 1] as PlanarityScene;

    this.inputConverter = new PlanarityPageInputConverter();
    this.inputParser = new PlanarityPageInputParser();
    this.clearBtn.addEventListener('click', this.lastScene.clear.bind(this.lastScene));

    const tabs = document.querySelectorAll<HTMLButtonElement>('.tabBtn');
    const modes = document.querySelectorAll<HTMLElement>('.graphMode');
    this.setupTabs(tabs, modes);

    this.lastStep = this.stepper.getStep();
    this.stepper.addEventListener('stepchange', (e) => {
      this.handleStep((e as CustomEvent<number>).detail);
    });
    this.handleStep(0);

    window.addEventListener('resize', this.resize.bind(this));
    this.resize();

    window.addEventListener('keydown', (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.key === 'z') {
        this.lastScene.undo();
      }
      if ((isCmdOrCtrl && e.key === 'y') || (isCmdOrCtrl && e.key === 'z' && e.shiftKey)) {
        this.lastScene.redo();
      }
    });

    //change this if default graph is not planar
    this.showStatus('Checking planarity... ✓', 'okay');

    const infoBtn = document.getElementById('infoBtn')!;
    infoBtn.addEventListener('click', (e: MouseEvent) => {
      const modal = document.getElementById('infoModalEditor')!;
      const modal2 = document.getElementById('infoModalCondition')!;
      if (this.lastStep === 4) {
        modal.classList.toggle('active');
      } else if (this.lastStep === 0) {
        modal2.classList.toggle('active');
      }
    });
  }

  private handleStep(step: number): void {
    this.planarityScenes[this.lastStep].stopAnimation();
    this.graphInputCard.style.display = step === 4 ? 'flex' : 'none';
    this.planarityScenes[step].startAnimation();
    this.lastStep = step;

    switch (step) {
      case 4:
        this.graphActions.style.display = 'flex';
        this.graphInputCard.style.display = 'flex';
        break;
      case 0:
        this.graphActions.style.display = 'flex';
        break;
      default:
        this.graphInputCard.style.display = 'none';
        this.graphActions.style.display = 'none';
        break;
    }
  }

  public async checkPlanarityOfUserInputGraph(): Promise<void> {
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
      this.currentGraph = graph;
      this.currentEmbeddingResult = await this.lastScene.checkPlanarityOfGraph(graph);
    } catch (error: any) {
      this.showStatus(error.message, 'error');
    }
  }

  public async computePlanarDrawingForInputGraph(): Promise<void> {
    if (this.currentGraph && this.currentEmbeddingResult && this.currentEmbeddingResult.planar) {
      this.lastScene.loadGraph(this.currentEmbeddingResult, this.currentGraph, true, 500);
    }
  }

  private resize(): void {
    const area = document.querySelector('.canvasArea')!;
    this.lastScene.resize(area.clientWidth, area.clientHeight);
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
