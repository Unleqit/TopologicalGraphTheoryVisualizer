// graphWorker.js
export let computeGraph = null;

let graphWorker = null;
let readyPromise = null;
let nextId = 0;
const pendingRequests = new Map();

// Lazy-init worker & Pyodide only on first call
computeGraph = function(edges, nodeCount) {
  if (!graphWorker) {
    // create worker once
    graphWorker = new Worker(URL.createObjectURL(new Blob([`
      let pyodide = null;
      let compute_layout = null;

      const readyPromise = (async () => {
        importScripts("https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js");
        pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.20.0/full/" });
        await pyodide.loadPackage(["networkx", "numpy"]);

        pyodide.runPython(\`
import networkx as nx
from networkx.algorithms.planar_drawing import combinatorial_embedding_to_pos
import numpy as np

def compute_layout(edges, n):
    G = nx.Graph()
    G.add_nodes_from(range(n))
    G.add_edges_from(edges)

    is_planar, emb = nx.check_planarity(G)
    if not is_planar:
        return {"planar": False, "nodes": [], "edges": []}

    pos = combinatorial_embedding_to_pos(emb, fully_triangulate=False)

    nodes = [{"id": int(v), "x": float(x), "y": float(y)}
             for v,(x,y) in pos.items()]
    edges = [[int(u), int(v)] for u,v in G.edges()]

    return {"planar": True, "nodes": nodes, "edges": edges}
        \`);

        compute_layout = pyodide.globals.get("compute_layout");
      })();

      self.onmessage = async (event) => {
        await readyPromise; // ensures compilation happens only once
        const { edges, nodeCount, id } = event.data;
        const result = compute_layout(edges, nodeCount);
        const jsResult = result.toJs({ dict_converter: Object.fromEntries });
        self.postMessage({ id, result: jsResult });
      };
    `], { type: "text/javascript" })));

    readyPromise = Promise.resolve(); // placeholder, worker handles actual readyPromise

    // Handle messages from the worker
    graphWorker.onmessage = (e) => {
      const { id, result } = e.data;
      const resolver = pendingRequests.get(id);
      if (resolver) {
        resolver(result);
        pendingRequests.delete(id);
      }
    };
  }

  // enqueue request
  return new Promise(resolve => {
    const id = nextId++;
    pendingRequests.set(id, resolve);
    graphWorker.postMessage({ edges, nodeCount, id });
  });
};