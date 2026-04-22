import { SurfaceSceneBase } from '../../surface-scene-base';

export type VisualizationStep = { description: string; stepNumber: number; redo: (context: SurfaceSceneBase) => void; undo: (context: SurfaceSceneBase) => void };
