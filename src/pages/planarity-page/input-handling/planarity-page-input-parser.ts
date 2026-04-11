import { PlanarityPageInputMatrix } from './planarity-page-input-matrix';

export class PlanarityPageInputParser {
  public rawAdjacencyListToInputMatrix(text: string): PlanarityPageInputMatrix {
    if (!text) {
      throw new Error('Please enter an adjacency list.');
    }
    const tempMap = new Map<number, number[]>();
    const splitResult = text
      .replace(/N=\d+/, '')
      .split('\n')
      .filter((splitted) => splitted !== '');
    for (let i = 0; i < splitResult.length; ++i) {
      if (!splitResult[i]) {
        throw new Error('Invalid list format.');
      }

      const neighbors = splitResult[i]
        .replace(/\d+:/, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((v) => {
          const num = Number(v);
          if (Number.isNaN(num)) {
            throw new Error('Invalid neighbor index.');
          }
          return num;
        })
        .filter((item) => item >= 0);

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

  public inputMatrixToRawAdjacencyList(inputMatrix: PlanarityPageInputMatrix): string {
    const lines: string[] = [];

    for (let i = 0; i < inputMatrix.length; i++) {
      const neighbors: number[] = [];

      for (let j = 0; j < inputMatrix[i].length; j++) {
        if (inputMatrix[i][j] !== 0) {
          neighbors.push(j);
        }
      }

      lines.push(neighbors.join(' '));
    }

    return lines.join('\n');
  }

  public rawMatrixToInputMatrix(text: string): PlanarityPageInputMatrix {
    text = text.trim();
    if (!text) {
      throw new Error('Please enter a matrix.');
    }
    const matrix = text.split('\n').map((line) =>
      line
        .trim()
        .split(/\s+/)
        .map((v) => {
          const num = Number(v);
          if (Number.isNaN(num)) {
            throw new Error('Invalid number in matrix.');
          }
          return num;
        })
    );
    return matrix;
  }

  public inputMatrixToRawMatrix(inputMatrix: PlanarityPageInputMatrix): string {
    return inputMatrix.map((row) => row.join(' ')).join('\n');
  }
}
