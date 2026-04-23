import { Graph } from '../../graph/types/graph';
import { PlanaritySceneBase } from './planarity-testing-editor-scene/planarity-scene-base';
import { PlanaritySceneHistoryManager } from './planarity-testing-editor-scene/planarity-scene-history-manager';
import { PlanaritySceneInteractionController } from './planarity-testing-editor-scene/planarity-scene-interaction-controller';
import { PlanaritySceneRenderController } from './planarity-testing-editor-scene/planarity-scene-render-controller';
import { PlanaritySceneSelectionManager } from './planarity-testing-editor-scene/planarity-scene-selection-manager';
import { PlanaritySceneUIController } from './planarity-testing-editor-scene/planarity-scene-ui-controller';

export class PlanarityTestingScene extends PlanaritySceneBase {
  private selectionManager: PlanaritySceneSelectionManager;
  private renderController: PlanaritySceneRenderController;
  private interactionController: PlanaritySceneInteractionController;
  private historyManager: PlanaritySceneHistoryManager;
  private uiController: PlanaritySceneUIController;

  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement);
    this.selectionManager = new PlanaritySceneSelectionManager();
    this.renderController = new PlanaritySceneRenderController(this, this.selectionManager);
    this.historyManager = new PlanaritySceneHistoryManager(
      () => {},
      () => {}
    );
    this.uiController = new PlanaritySceneUIController(
      () => {},
      () => {}
    );
    this.interactionController = new PlanaritySceneInteractionController(this, this.selectionManager, this.renderController, this.historyManager, this.uiController);

    this.interactionController.renderGraphToUI([PLANARITY_CONDITION_SCENE_GRAPH], false, 250, true, false, 0, true);
  }
}

export const PLANARITY_CONDITION_SCENE_GRAPH: Graph = JSON.parse(
  `{"nodes":[{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1}],"edges":[{"id":"0,1","value":[0,1]},{"id":"0,2","value":[0,2]},{"id":"0,3","value":[0,3]},{"id":"0,4","value":[0,4]},{"id":"1,2","value":[1,2]},{"id":"1,3","value":[1,3]},{"id":"1,4","value":[1,4]},{"id":"1,6","value":[1,6]},{"id":"1,9","value":[1,9]},{"id":"1,11","value":[1,11]},{"id":"2,3","value":[2,3]},{"id":"2,4","value":[2,4]},{"id":"2,10","value":[2,10]},{"id":"3,4","value":[3,4]},{"id":"3,5","value":[3,5]},{"id":"3,6","value":[3,6]},{"id":"3,7","value":[3,7]},{"id":"3,8","value":[3,8]},{"id":"5,7","value":[5,7]},{"id":"5,10","value":[5,10]},{"id":"5,11","value":[5,11]},{"id":"6,8","value":[6,8]},{"id":"7,9","value":[7,9]},{"id":"8,9","value":[8,9]},{"id":"10,11","value":[10,11]}]}`
);
