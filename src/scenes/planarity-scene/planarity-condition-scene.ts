import { Color, MeshBasicMaterial } from 'three';
import { Graph } from '../../graph/types/graph';
import { PlanaritySceneBase } from './planarity-testing-editor-scene/planarity-scene-base';
import { PlanaritySceneHistoryManager } from './planarity-testing-editor-scene/planarity-scene-history-manager';
import { PlanaritySceneInteractionController } from './planarity-testing-editor-scene/planarity-scene-interaction-controller';
import { PlanaritySceneRenderController } from './planarity-testing-editor-scene/planarity-scene-render-controller';
import { PlanaritySceneSelectionManager } from './planarity-testing-editor-scene/planarity-scene-selection-manager';
import { PlanaritySceneUIController } from './planarity-testing-editor-scene/planarity-scene-ui-controller';
import { GraphLayoutService } from './planarity-testing-editor-scene/layout/graph-layout-service';
import { PlanarityConditionInteractionController } from './planarity-testing-editor-scene/planarity-condition-interaction-controller';

export class PlanarityConditionScene extends PlanaritySceneBase {
  private selectionManager: PlanaritySceneSelectionManager;
  private renderController: PlanaritySceneRenderController;
  private interactionController: PlanarityConditionInteractionController;
  private historyManager: PlanaritySceneHistoryManager;
  private uiController: PlanaritySceneUIController;
  private graphLayoutService: GraphLayoutService;

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
    this.graphLayoutService = new GraphLayoutService();
    this.interactionController = new PlanarityConditionInteractionController(this, this.selectionManager, this.renderController, this.historyManager, this.uiController);

    const graph = PLANARITY_CONDITION_SCENE_GRAPH;
    const renderingResult = this.renderController.render(graph);
    const ids: string[] = ['0,1', '0,2', '0,3', '0,4', '1,2', '1,3', '1,4', '2,3', '2,4', '3,4'];
    renderingResult[0].edgeLines.forEach((edgeLine) => {
      if (ids.includes(edgeLine.id)) {
        (edgeLine.line.material as MeshBasicMaterial).color = new Color(255, 0, 0);
      }
    });

    this.renderController.applyRenderingResult(renderingResult, false, 250, true, false);
    this.check(graph);
    this.historyManager.commitToHistory(graph);
  }

  private async check(graph: Graph): Promise<void> {
    if (graph.nodes.length > 0) {
      const embeddingResult = await this.graphLayoutService.compute(
        graph.edges.map((edge): [number, number] => edge.value),
        graph.nodes.length
      );

      if (!embeddingResult.planar) {
        this.uiController.updateStatus('Checking planarity... ✗', 'error');
      } else {
        this.uiController.updateStatus('Checking planarity... ✓', 'okay');
      }
    } else {
      this.uiController.updateStatus('', 'info');
    }
  }
}

export const PLANARITY_CONDITION_SCENE_GRAPH: Graph = JSON.parse(
  `{"nodes":[{"id":0,"x":2.0926627680637253,"y":0.5383774992047708},{"id":1,"x":4.505348250462217,"y":0.5771005529280689},{"id":2,"x":0.8540648733564788,"y":2.8617607226026394},{"id":3,"x":2.892590575062156,"y":4.217067602918063},{"id":4,"x":5.421394610089452,"y":3.0811913603679937},{"id":5,"x":0.3637865400348601,"y":3.85565243483395},{"id":6,"x":2.866786452255755,"y":5.456205322063592},{"id":7,"x":6.918033732860708,"y":0.08660853909963007},{"id":8,"x":1.602384434742107,"y":-1.2816060257902269},{"id":9,"x":0.041235004954847554,"y":0.5512851837792038},{"id":10,"x":5.860064697798268,"y":0.6416389758002317},{"id":11,"x":-0.6941824950275808,"y":5.056067100256183}],"edges":[{"id":"0,1","value":[0,1]},{"id":"2,3","value":[2,3]},{"id":"3,4","value":[3,4]},{"id":"1,4","value":[1,4]},{"id":"0,3","value":[0,3]},{"id":"1,3","value":[1,3]},{"id":"2,4","value":[2,4]},{"id":"0,4","value":[0,4]},{"id":"1,2","value":[1,2]},{"id":"2,5","value":[2,5]},{"id":"5,6","value":[5,6]},{"id":"3,6","value":[3,6]},{"id":"4,6","value":[4,6]},{"id":"6,7","value":[6,7]},{"id":"4,7","value":[4,7]},{"id":"8,9","value":[8,9]},{"id":"4,8","value":[4,8]},{"id":"6,9","value":[6,9]},{"id":"5,9","value":[5,9]},{"id":"5,9","value":[5,9]},{"id":"5,8","value":[5,8]},{"id":"7,8","value":[7,8]},{"id":"4,8","value":[4,8]},{"id":"4,8","value":[4,8]},{"id":"4,10","value":[4,10]},{"id":"8,10","value":[8,10]},{"id":"7,10","value":[7,10]},{"id":"9,11","value":[9,11]},{"id":"6,11","value":[6,11]},{"id":"7,11","value":[7,11]},{"id":"0,2","value":[2,0]}]}`
);
