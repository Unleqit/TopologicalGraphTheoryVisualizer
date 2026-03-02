// graphWorker.js

export type Node = {
  id: number;
  x: number;
  y: number;
};

export type Edge = [number, number];

export type EmbeddingResult = {
  planar: boolean;
  nodes: Node[];
  edges: Edge[];
};

let graphWorker: Worker | undefined;
let nextId = 0;
const pendingRequests = new Map();

// Lazy-init worker & Pyodide only on first call
export const computeGraph = async function (edges: [number, number][], nodeCount: number): Promise<EmbeddingResult> {
  if (!graphWorker) {
    // create worker once
    const pythonFile = await fetch('./layout_computation.py');
    const pythonCode = await pythonFile.text();
    graphWorker = new Worker(
      URL.createObjectURL(
        new Blob(
          [
            `
      let pyodide = null;
      let compute_layout = null;

      const readyPromise = (async () => {
        importScripts("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js");
        pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.20.0/full/" });
        await pyodide.loadPackage(["networkx", "numpy"]);

        pyodide.runPython(${JSON.stringify(pythonCode)});

        compute_layout = pyodide.globals.get("compute_layout");
      })();

      self.onmessage = async (event) => {
        await readyPromise; // ensures compilation happens only once
        const { edges, nodeCount, id } = event.data;
        const result = compute_layout(edges, nodeCount);
        const jsResult = result.toJs({ dict_converter: Object.fromEntries });
        self.postMessage({ id, result: jsResult });
      };
    `,
          ],
          { type: 'text/javascript' }
        )
      )
    );

    // Handle messages from the worker
    graphWorker.onmessage = (e: any) => {
      const { id, result } = e.data;
      const resolver = pendingRequests.get(id);
      if (resolver) {
        resolver(result);
        pendingRequests.delete(id);
      }
    };
  }

  // enqueue request
  return new Promise((resolve) => {
    const id = nextId++;
    pendingRequests.set(id, resolve);
    graphWorker!.postMessage({ edges, nodeCount, id });
  });
};
