import { Graph } from '../../graph/types/graph';
import { PlanaritySceneBase } from './planarity-testing-editor-scene/planarity-scene-base';

export class PlanarityEmbeddingScene extends PlanaritySceneBase {
  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement);
    const graph = PLANARITY_CONDITION_SCENE_GRAPH;
    const k5Edges: string[] = [];
  }
}

export const PLANARITY_CONDITION_SCENE_GRAPH: Graph = JSON.parse(
  `{"nodes":[{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1},{"x":-1,"y":-1}],"edges":[{"id":"0,1","value":[0,1]},{"id":"0,2","value":[0,2]},{"id":"0,3","value":[0,3]},{"id":"0,4","value":[0,4]},{"id":"1,2","value":[1,2]},{"id":"1,3","value":[1,3]},{"id":"1,4","value":[1,4]},{"id":"1,6","value":[1,6]},{"id":"1,9","value":[1,9]},{"id":"1,11","value":[1,11]},{"id":"2,3","value":[2,3]},{"id":"2,4","value":[2,4]},{"id":"2,10","value":[2,10]},{"id":"3,4","value":[3,4]},{"id":"3,5","value":[3,5]},{"id":"3,6","value":[3,6]},{"id":"3,7","value":[3,7]},{"id":"3,8","value":[3,8]},{"id":"5,7","value":[5,7]},{"id":"5,10","value":[5,10]},{"id":"5,11","value":[5,11]},{"id":"6,8","value":[6,8]},{"id":"7,9","value":[7,9]},{"id":"8,9","value":[8,9]},{"id":"10,11","value":[10,11]}]}`
);
