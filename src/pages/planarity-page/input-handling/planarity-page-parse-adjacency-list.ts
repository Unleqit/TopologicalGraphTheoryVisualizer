export function parseAdjacencyList(text: string): number[][] {
  if (!text) {
    throw new Error('Please enter an adjacency list.');
  }
  const tempMap = new Map<number, number[]>();
  const splitResult = text.split('\n');
  for (let i = 0; i < splitResult.length; ++i) {
    if (!splitResult[i]) {
      throw new Error('Invalid list format.');
    }
    const neighbors = splitResult[i]
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((v) => {
        const num = Number(v);
        if (Number.isNaN(num)) {
          throw new Error('Invalid neighbor index.');
        }
        return num;
      });
    tempMap.set(i, neighbors);
  }

  const n = Math.max(...tempMap.keys()) + 1;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (const [u, neighbors] of tempMap) {
    for (const v of neighbors) {
      matrix[u][v] = 1;
      matrix[v][u] = 1;
    }
  }

  return matrix;
}
