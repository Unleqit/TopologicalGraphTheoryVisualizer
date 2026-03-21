import { GraphCanonicalOrdering } from './graph-canonical-ordering';

export type GraphEmbeddingPythonResult = {
  planar: boolean;
  canonical_ordering: GraphCanonicalOrdering;
};
