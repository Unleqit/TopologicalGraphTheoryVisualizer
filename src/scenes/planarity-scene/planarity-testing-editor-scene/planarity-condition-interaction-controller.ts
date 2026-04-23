import { Color, MeshBasicMaterial } from 'three';
import { Graph } from '../../../graph/types/graph';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-scene-graph-rendering-result';
import { PlanaritySceneBase } from './planarity-scene-base';
import { PlanaritySceneHistoryManager } from './planarity-scene-history-manager';
import { PlanaritySceneInteractionController } from './planarity-scene-interaction-controller';
import { PlanaritySceneRenderController } from './planarity-scene-render-controller';
import { PlanaritySceneSelectionManager } from './planarity-scene-selection-manager';
import { PlanaritySceneUIController } from './planarity-scene-ui-controller';
import { PlanaritySceneMouseHandler } from './planarity-scene-mouse-handler';

export class PlanarityConditionInteractionController extends PlanaritySceneInteractionController {
  constructor(
    sceneBase: PlanaritySceneBase,
    selectionManager: PlanaritySceneSelectionManager,
    renderController: PlanaritySceneRenderController,
    historyManager: PlanaritySceneHistoryManager,
    uiController: PlanaritySceneUIController
  ) {
    super(sceneBase, selectionManager, renderController, historyManager, uiController);
    //disallow creation and deletion of new vertices in this scene
    this.mouseHandler = new PlanaritySceneMouseHandler(
      this.sceneBase,
      () => {},
      this.handleSelection.bind(this),
      this.dragVertex.bind(this),
      this.releaseVertex.bind(this),
      () => {}
    );
  }

  public override async renderGraphToUI(
    graphs: Graph[],
    stepwise: boolean,
    millisecondsPerStep: number,
    recenter: boolean,
    animate: boolean,
    animationDurationMs: number,
    commitToHistory: boolean
  ): Promise<void> {
    const renderingResult = this.renderController.render(...graphs);
    await this.renderController.applyRenderingResult(renderingResult, stepwise, millisecondsPerStep, recenter, animate, animationDurationMs);
  }

  protected override handleCtrlClick(mouseX: number, mouseY: number): void {}

  protected override handleDelete(): void {}

  protected override releaseVertex(): void {
    if (this.clone) {
      this.historyManager.commitToHistory(this.clone);
      const renderingResult = this.renderController.render(this.clone);
      this.changeColor(renderingResult);
      this.renderController.applyRenderingResult(renderingResult, false, 0, false, false);
    }
  }

  protected changeColor(renderingResults: PlanarityPageGraphRenderingResult[]): void {
    const ids: string[] = ['0,1', '0,2', '0,3', '0,4', '1,2', '1,3', '1,4', '2,3', '2,4', '3,4'];
    renderingResults.forEach((renderingResult) =>
      renderingResult.edgeLines.forEach((edgeLine) => {
        if (ids.includes(edgeLine.id)) {
          (edgeLine.line.material as MeshBasicMaterial).color = new Color(255, 0, 0);
        }
      })
    );
  }
}
