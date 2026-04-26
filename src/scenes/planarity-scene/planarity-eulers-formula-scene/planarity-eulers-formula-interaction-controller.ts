import { Color, MeshBasicMaterial } from 'three';
import { Graph } from '../../../graph/types/graph';
import { PlanarityPageGraphRenderingResult } from '../planarity-editor-scene/graph-renderer/planarity-scene-graph-rendering-result';
import { PlanaritySceneBase } from '../planarity-editor-scene/planarity-scene-base';
import { PlanaritySceneHistoryManager } from '../planarity-editor-scene/planarity-scene-history-manager';
import { PlanaritySceneInteractionController } from '../planarity-editor-scene/planarity-scene-interaction-controller';
import { PlanaritySceneRenderController } from '../planarity-editor-scene/planarity-scene-render-controller';
import { PlanaritySceneSelectionManager } from '../planarity-editor-scene/planarity-scene-selection-manager';
import { PlanaritySceneUIController } from '../planarity-editor-scene/planarity-scene-ui-controller';
import { PlanaritySceneMouseHandler } from '../planarity-editor-scene/planarity-scene-mouse-handler';

export class PlanarityEulersFormulaInteractionController extends PlanaritySceneInteractionController {
  constructor(
    sceneBase: PlanaritySceneBase,
    selectionManager: PlanaritySceneSelectionManager,
    renderController: PlanaritySceneRenderController,
    historyManager: PlanaritySceneHistoryManager,
    uiController: PlanaritySceneUIController
  ) {
    super(sceneBase, selectionManager, renderController, historyManager, uiController);
    //disallow interacting with graphs in this scene
    this.mouseHandler = new PlanaritySceneMouseHandler(
      this.sceneBase,
      () => {},
      (x: number, y: number): boolean => {
        return false;
      },
      () => {},
      () => {},
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

  protected override releaseVertex(): void {}
}
