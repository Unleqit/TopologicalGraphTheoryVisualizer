import { Graph } from '../../graph/types/graph';

export const PLANARITY_PAGE_DEFAULT_GRAPH_INPUT: number[][] = [
  [0, 1, 1, 1, 0],
  [1, 0, 1, 0, 0],
  [1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1],
  [0, 0, 1, 1, 0],
];

export const PLANARITY_PAGE_DEFAULT_GRAPH_RESULT: Graph = JSON.parse(
  `{
    "nodes": [
      { "id": 0, "x": 0, "y": 0 },
      { "id": 1, "x": 6, "y": 0 },
      { "id": 2, "x": 5, "y": 1 },
      { "id": 3, "x": 2, "y": 2 },
      { "id": 4, "x": 3, "y": 3 }
    ],
    "edges": [
      { "id": "0,1", "value": [0, 1] },
      { "id": "0,2", "value": [0, 2] },
      { "id": "0,3", "value": [0, 3] },
      { "id": "1,2", "value": [1, 2] },
      { "id": "2,3", "value": [2, 3] },
      { "id": "2,4", "value": [2, 4] },
      { "id": "3,4", "value": [3, 4] }
    ]
  }`
);
