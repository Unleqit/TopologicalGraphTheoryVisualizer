import { GraphEmbeddingPythonResult } from '../graph/graph-embedding-python-result';

export class GraphLayoutService {
  private worker: Worker;
  private nextId = 0;
  private pending = new Map<number, (r: GraphEmbeddingPythonResult) => void>();

  constructor() {
    this.worker = new Worker(new URL('./layout-worker.ts', import.meta.url), { type: 'module' });

    this.worker.onmessage = (e: MessageEvent) => {
      const { id, result } = e.data;
      const resolver = this.pending.get(id);
      if (resolver) {
        resolver(result);
        this.pending.delete(id);
      }
    };
  }

  compute(edges: [number, number][], nodeCount: number): Promise<GraphEmbeddingPythonResult> {
    return new Promise((resolve) => {
      const id = this.nextId++;
      this.pending.set(id, resolve);
      this.worker.postMessage({ edges, nodeCount, id });
    });
  }
}
