export function validateMatrix(matrix: number[][]): boolean {
  const n = matrix.length;
  if (!matrix.every((row) => row.length === n)) {
    throw new Error('Matrix must be square.');
  }
  for (let i = 0; i < n; i++) {
    if (matrix[i][i] !== 0) {
      throw new Error('Diagonal must be 0.');
    }
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] !== matrix[j][i]) {
        throw new Error('Graph must be undirected.');
      }
    }
  }
  return true;
}
