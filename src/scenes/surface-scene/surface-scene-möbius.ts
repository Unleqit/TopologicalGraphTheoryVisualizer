import { square } from './coordinate-transformation-functions/square';
import { VisualizationStep } from './visualization/types/visualization-step';
import { squareMöbius } from './coordinate-transformation-functions/square-möbius';
import { k33Vertices, k33Edges, K33_EDGE_SEGMENTS } from './visualization/step-definitions/k33/k33-definition';
import { k33FlipVertex2And5_FlipVertices } from './visualization/step-definitions/k33/redo/redo-k33-flip-vertex-2-and-5-flip-vertices';
import { k33FlipVertex2And5_HideAffectedEdges } from './visualization/step-definitions/k33/redo/redo-k33-flip-vertex-2-and-5-hide-affected-edges';
import { k33FlipVertex2And5_RedrawAffectedEdges } from './visualization/step-definitions/k33/redo/redo-k33-flip-vertex-2-and-5-redraw-affected-edges';
import { k33RerouteEdge16_HideAffectedEdge } from './visualization/step-definitions/k33/redo/redo-k33-reroute-edge-16-hide-affected-edge';
import { k33RerouteEdge16_RedrawAffectedEdge } from './visualization/step-definitions/k33/redo/redo-k33-reroute-edge-16-redraw-affected-edges';
import { k33RerouteEdge34_HideAffectedEdge } from './visualization/step-definitions/k33/redo/redo-k33-reroute-edge-34-hide-affected-edges';
import { k33RerouteEdge34_RedrawAffectedEdge } from './visualization/step-definitions/k33/redo/redo-k33-reroute-edge-34-redraw-affected-edge';
import { _undoK33FlipVertex2And5_FlipVertices } from './visualization/step-definitions/k33/undo/undo-k33-flip-vertex-2-and-5-flip-vertices';
import { _undoK33FlipVertex2And5_HideAffectedEdges } from './visualization/step-definitions/k33/undo/undo-k33-flip-vertex-2-and-5-hide-affected-edges';
import { _undoK33FlipVertex2And5_RedrawAffectedEdges } from './visualization/step-definitions/k33/undo/undo-k33-flip-vertex-2-and-5-redraw-affected-edges';
import { _undoK33RerouteEdge16_HideAffectedEdge } from './visualization/step-definitions/k33/undo/undo-k33-reroute-edge-16-hide-affected-edge';
import { _undoK33RerouteEdge16_RedrawAffectedEdge } from './visualization/step-definitions/k33/undo/undo-k33-reroute-edge-16-redraw-affected-edges';
import { _undoK33RerouteEdge34_HideAffectedEdge } from './visualization/step-definitions/k33/undo/undo-k33-reroute-edge-34-hide-affected-edge';
import { _undoK33RerouteEdge34_RedrawAffectedEdge } from './visualization/step-definitions/k33/undo/undo-k33-reroute-edge-34-redraw-affected-edge';
import { showVerticesAtStart } from './visualization/step-definitions/common/redo/redo-show-vertices-at-start';
import { _undoShowVerticesAtStart } from './visualization/step-definitions/common/undo/undo-show-vertices-at-start';
import { showEdgesAtStart } from './visualization/step-definitions/common/redo/redo-show-edges-at-start';
import { _undoShowEdgesAtStart } from './visualization/step-definitions/common/undo/undo-show-edges-at-start';
import { DoubleSide, MeshStandardMaterial, Scene } from 'three';
import { SurfaceSceneBase } from './surface-scene-base';
import { UpdateUIFunction } from './visualization/types/update-ui-function';

export class SurfaceSceneMöbius extends SurfaceSceneBase {
  constructor(scene: Scene, updateUIFunction: UpdateUIFunction) {
    const xScale = 1.5;
    const yScale = 1.5;
    const vertexMat = new MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: DoubleSide });

    const descriptions: string[] = [
      'Showing K33 vertices',
      'Showing K33 edges',
      'Hiding all edges connecting to vertex 2 or 5',
      'Flipping vertices 2 and 5',
      'Redrawing edges connecting to vertex 2 or 5',
      'Hiding edge 3,4',
      'Rerouting edge 3,4 over horizontal square borders',
      'Hiding edge 1,6',
      'Rerouting edge 1,6 over vertical square borders',
    ];

    const reorderingSteps: VisualizationStep[] = [
      { description: descriptions[0], stepNumber: 0, redo: showVerticesAtStart, undo: _undoShowVerticesAtStart },
      { description: descriptions[1], stepNumber: 1, redo: showEdgesAtStart, undo: _undoShowEdgesAtStart },
      { description: descriptions[2], stepNumber: 2, redo: k33FlipVertex2And5_HideAffectedEdges, undo: _undoK33FlipVertex2And5_HideAffectedEdges },
      { description: descriptions[3], stepNumber: 3, redo: k33FlipVertex2And5_FlipVertices, undo: _undoK33FlipVertex2And5_FlipVertices },
      { description: descriptions[4], stepNumber: 4, redo: k33FlipVertex2And5_RedrawAffectedEdges, undo: _undoK33FlipVertex2And5_RedrawAffectedEdges },
      { description: descriptions[5], stepNumber: 5, redo: k33RerouteEdge34_HideAffectedEdge, undo: _undoK33RerouteEdge34_HideAffectedEdge },
      { description: descriptions[6], stepNumber: 6, redo: k33RerouteEdge34_RedrawAffectedEdge, undo: _undoK33RerouteEdge34_RedrawAffectedEdge },
      { description: descriptions[7], stepNumber: 7, redo: k33RerouteEdge16_HideAffectedEdge, undo: _undoK33RerouteEdge16_HideAffectedEdge },
      { description: descriptions[8], stepNumber: 8, redo: k33RerouteEdge16_RedrawAffectedEdge, undo: _undoK33RerouteEdge16_RedrawAffectedEdge },
    ];

    super(scene, vertexMat, k33Vertices, k33Edges, K33_EDGE_SEGMENTS, reorderingSteps, square, squareMöbius, updateUIFunction, 7, 1, 3, xScale, yScale);
  }
}
