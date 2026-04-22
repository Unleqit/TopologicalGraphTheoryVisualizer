import { SurfaceSceneBaseUIDisplayResult } from './visualization-context-ui-display-result';
import { SurfaceSceneBaseUpdateUISource } from './visualization-context-ui-update-source';

export type UpdateUIFunction = (value: SurfaceSceneBaseUIDisplayResult, source: SurfaceSceneBaseUpdateUISource) => void;
