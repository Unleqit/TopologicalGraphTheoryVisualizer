import networkx as nx
from networkx.algorithms.planar_drawing import combinatorial_embedding_to_pos
import numpy as np

def compute_layout(edges, n):
    G = nx.Graph()
    G.add_nodes_from(range(n))
    G.add_edges_from(edges)

    is_planar, emb = nx.check_planarity(G)
    if not is_planar:
        return {"planar": False, "nodes": [], "edges": []}

    pos = combinatorial_embedding_to_pos(emb, fully_triangulate=False)

    nodes = [{"id": int(v), "x": float(x), "y": float(y)} for v,(x,y) in pos.items()]
    edges = [[int(u), int(v)] for u,v in G.edges()]
    return {"planar": True, "nodes": nodes, "edges": edges}