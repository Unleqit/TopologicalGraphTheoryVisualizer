import { VisualizationContextUIDisplayResult } from './visualization-context-ui-display-result';
import { VisualizationContextUpdateUISource } from './visualization-context-ui-update-source';

export type UpdateUIFunction = (value: VisualizationContextUIDisplayResult, source: VisualizationContextUpdateUISource) => void;
