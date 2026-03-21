import { VisualizationContext } from './visualization-context';

export type VisualizationStep = { description: string; stepNumber: number; redo: (context: VisualizationContext) => void; undo: (context: VisualizationContext) => void };
