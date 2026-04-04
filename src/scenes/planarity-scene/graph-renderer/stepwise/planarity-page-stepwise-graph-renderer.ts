import { Vector3 } from 'three';
import { PlanarityPageGraphRenderer } from '../planarity-page-graph-renderer';
import { GraphEmbeddingStepResult } from '../../../../graph/types/graph-embedding-step-result';
import { PlanarityPageStepwiseGraphRenderingResult } from './planarity-page-stepwise-graph-rendering-result';
import { PlanarityPageGraphRenderingResult } from '../planarity-page-graph-rendering-result';

export class PlanarityPageStepwiseGraphRenderer extends PlanarityPageGraphRenderer {
  private isRunning: boolean;
  private result: PlanarityPageStepwiseGraphRenderingResult = { steps: [] };
  private onEachIteration: (iterationResult: PlanarityPageGraphRenderingResult) => void;

  constructor(onEachIteration: (iterationResult: PlanarityPageGraphRenderingResult) => void, onGraphRecenter: (newPosition: Vector3) => void) {
    super(onGraphRecenter);
    this.onEachIteration = onEachIteration;
    this.isRunning = false;
  }

  public async startRendering(steps: GraphEmbeddingStepResult, millisecondsPerStep: number = 250): Promise<PlanarityPageStepwiseGraphRenderingResult> {
    if (!this.isRunning) {
      this.isRunning = true;
    } else {
      return this.result;
    }

    for (let i = 0; i < steps.nodes.length; ++i) {
      if (this.isRunning) {
        const iterationResult = super.render(steps.nodes[i], steps.edges[i]);
        this.result.steps.push(iterationResult);
        super.centerGroup(iterationResult.graphGroup);
        this.onEachIteration(iterationResult);

        await new Promise((r) => setTimeout(r, millisecondsPerStep));
      }
    }

    return this.result;
  }

  public stop(): PlanarityPageStepwiseGraphRenderingResult {
    if (this.isRunning) {
      this.isRunning = false;
    }
    return this.result;
  }
}
