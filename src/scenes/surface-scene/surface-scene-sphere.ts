import { square } from './coordinate-transformation-functions/square';
import { squareCylinderSphere } from './coordinate-transformation-functions/square-cylinder-sphere';
import { VisualizationStep } from './visualization/types/visualization-step';
import { K3_EDGE_SEGMENTS, k3Edges, k3Vertices } from './visualization/step-definitions/k3/k3-definition';
import { showVerticesAtStart } from './visualization/step-definitions/common/redo/redo-show-vertices-at-start';
import { _undoShowVerticesAtStart } from './visualization/step-definitions/common/undo/undo-show-vertices-at-start';
import { showEdgesAtStart } from './visualization/step-definitions/common/redo/redo-show-edges-at-start';
import { _undoShowEdgesAtStart } from './visualization/step-definitions/common/undo/undo-show-edges-at-start';
import { Scene, MeshStandardMaterial, DoubleSide } from 'three';
import { SurfaceSceneBase } from '../surface-scene-base';
import { UpdateUIFunction } from './visualization/types/update-ui-function';

export class SurfaceSceneSphere extends SurfaceSceneBase {
  constructor(scene: Scene, updateUIFunction: UpdateUIFunction) {
    const xScale = 1.5;
    const yScale = 1.5;
    const vertexMat = new MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: DoubleSide });

    const descriptions: string[] = [
      'Showing K3 vertices', //enforce newline for better readabiliy
      'Showing K3 edges',
    ];

    const reorderingSteps: VisualizationStep[] = [
      { description: descriptions[0], stepNumber: 0, redo: showVerticesAtStart, undo: _undoShowVerticesAtStart },
      { description: descriptions[1], stepNumber: 1, redo: showEdgesAtStart, undo: _undoShowEdgesAtStart },
    ];

    super(scene, vertexMat, k3Vertices, k3Edges, K3_EDGE_SEGMENTS, reorderingSteps, square, squareCylinderSphere, updateUIFunction, 2, 1, 3, xScale, yScale);
  }
}
