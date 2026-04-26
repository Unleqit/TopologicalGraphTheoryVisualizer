import { Color, MeshBasicMaterial } from 'three';
import { Graph } from '../../../graph/types/graph';
import { PlanaritySceneBase } from '../planarity-editor-scene/planarity-scene-base';
import { PlanaritySceneHistoryManager } from '../planarity-editor-scene/planarity-scene-history-manager';
import { PlanaritySceneRenderController } from '../planarity-editor-scene/planarity-scene-render-controller';
import { PlanaritySceneSelectionManager } from '../planarity-editor-scene/planarity-scene-selection-manager';
import { PlanaritySceneUIController } from '../planarity-editor-scene/planarity-scene-ui-controller';
import { GraphLayoutService } from '../planarity-editor-scene/layout/graph-layout-service';
import { PlanarityConditionInteractionController } from './planarity-condition-interaction-controller';
import { PLANARITY_CONDITION_K5_VERTEX_INDICES } from './planarity-condition-k5-vertex-indices';

export class PlanarityConditionScene extends PlanaritySceneBase {
  private selectionManager: PlanaritySceneSelectionManager;
  private renderController: PlanaritySceneRenderController;
  private interactionController: PlanarityConditionInteractionController;
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
    this.interactionController = new PlanarityConditionInteractionController(this, this.selectionManager, this.renderController, this.historyManager, this.uiController);

    const graph = PLANARITY_CONDITION_SCENE_GRAPH;
    const renderingResult = this.renderController.render(graph);
    renderingResult[0].edgeLines.forEach((edgeLine) => {
      if (PLANARITY_CONDITION_K5_VERTEX_INDICES.includes(edgeLine.id)) {
        (edgeLine.line.material as MeshBasicMaterial).color = new Color(255, 0, 0);
      }
    });

    this.renderController.applyRenderingResult(renderingResult, false, 250, true, false);
    this.uiController.updateStatus('Checking planarity... ✗', 'error');
    this.historyManager.commitToHistory(graph);
  }
}

export const PLANARITY_CONDITION_SCENE_GRAPH: Graph = JSON.parse(
  `{"nodes":[{"id":0,"x":0,"y":0},{"id":1,"x":5.123431623950623,"y":-0.23200558720651987},{"id":2,"x":5.6721864185928474,"y":1.3485594831718133},{"id":3,"x":-0.3211479639624839,"y":2.6675814388565953},{"id":4,"x":1.772585838216066,"y":4.739038860656503},{"id":5,"x":5.435651497158681,"y":3.7608631381610413}],"edges":[{"id":"0,1","value":[0,1]},{"id":"0,2","value":[0,2]},{"id":"0,3","value":[0,3]},{"id":"1,2","value":[1,2]},{"id":"2,3","value":[2,3]},{"id":"2,4","value":[2,4]},{"id":"3,4","value":[3,4]},{"id":"0,4","value":[0,4]},{"id":"0,5","value":[0,5]},{"id":"4,5","value":[4,5]},{"id":"3,5","value":[3,5]},{"id":"2,5","value":[2,5]},{"id":"1,4","value":[4,1]}]}`
);
