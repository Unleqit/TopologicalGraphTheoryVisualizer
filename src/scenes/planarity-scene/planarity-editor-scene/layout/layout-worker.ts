/// <reference lib="webworker" />

import pythonCode from './layout_computation.py';

let pyodide: any = null;
let compute_layout: any = null;

const readyPromise = (async () => {
  importScripts('https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js');

  pyodide = await (self as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.20.0/full/' });

  await pyodide.loadPackage(['networkx', 'numpy']);
  pyodide.runPython(pythonCode);
  compute_layout = pyodide.globals.get('compute_layout');
})();

self.onmessage = async (event: MessageEvent) => {
  await readyPromise;

  const { edges, nodeCount, id } = event.data;

  const result = compute_layout(edges, nodeCount);
  const jsResult = result.toJs({ dict_converter: Object.fromEntries });

  self.postMessage({ id, result: jsResult });
};
