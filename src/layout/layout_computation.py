import networkx as nx
from networkx.algorithms.planarity import PlanarEmbedding
from collections import defaultdict

def compute_layout(edges, n):
    G = nx.Graph()
    G.add_nodes_from(range(n))
    G.add_edges_from(edges)

    is_planar, emb = nx.check_planarity(G)
    if not is_planar:
        return {"planar": False, "canonical_ordering": [] }

    embedding, outer_face = triangulate_embedding(emb, False)
    canonical_ordering = get_canonical_ordering(embedding, outer_face)

    return { "planar": True, "canonical_ordering": canonical_ordering }

def get_canonical_ordering(embedding, outer_face):
    v1 = outer_face[0]
    v2 = outer_face[1]
    chords = defaultdict(int)  # Maps nodes to the number of their chords
    marked_nodes = set()
    ready_to_pick = set(outer_face)

    # Initialize outer_face_ccw_nbr (do not include v1 -> v2)
    outer_face_ccw_nbr = {}
    prev_nbr = v2
    for idx in range(2, len(outer_face)):
        outer_face_ccw_nbr[prev_nbr] = outer_face[idx]
        prev_nbr = outer_face[idx]
    outer_face_ccw_nbr[prev_nbr] = v1

    # Initialize outer_face_cw_nbr (do not include v2 -> v1)
    outer_face_cw_nbr = {}
    prev_nbr = v1
    for idx in range(len(outer_face) - 1, 0, -1):
        outer_face_cw_nbr[prev_nbr] = outer_face[idx]
        prev_nbr = outer_face[idx]

    def is_outer_face_nbr(x, y):
        if x not in outer_face_ccw_nbr:
            return outer_face_cw_nbr[x] == y
        if x not in outer_face_cw_nbr:
            return outer_face_ccw_nbr[x] == y
        return outer_face_ccw_nbr[x] == y or outer_face_cw_nbr[x] == y

    def is_on_outer_face(x):
        return x not in marked_nodes and (x in outer_face_ccw_nbr.keys() or x == v1)

    # Initialize number of chords
    for v in outer_face:
        for nbr in embedding.neighbors_cw_order(v):
            if is_on_outer_face(nbr) and not is_outer_face_nbr(v, nbr):
                chords[v] += 1
                ready_to_pick.discard(v)

    # Initialize canonical_ordering
    canonical_ordering = [None] * len(embedding.nodes())  # type: list
    canonical_ordering[0] = (v1, [])
    canonical_ordering[1] = (v2, [])
    ready_to_pick.discard(v1)
    ready_to_pick.discard(v2)

    for k in range(len(embedding.nodes()) - 1, 1, -1):
        # 1. Pick v from ready_to_pick
        v = ready_to_pick.pop()
        marked_nodes.add(v)

        # v has exactly two neighbors on the outer face (wp and wq)
        wp = None
        wq = None
        # Iterate over neighbors of v to find wp and wq
        nbr_iterator = iter(embedding.neighbors_cw_order(v))
        while True:
            nbr = next(nbr_iterator)
            if nbr in marked_nodes:
                # Only consider nodes that are not yet removed
                continue
            if is_on_outer_face(nbr):
                # nbr is either wp or wq
                if nbr == v1:
                    wp = v1
                elif nbr == v2:
                    wq = v2
                else:
                    if outer_face_cw_nbr[nbr] == v:
                        # nbr is wp
                        wp = nbr
                    else:
                        # nbr is wq
                        wq = nbr
            if wp is not None and wq is not None:
                # We don't need to iterate any further
                break

        # Obtain new nodes on outer face (neighbors of v from wp to wq)
        wp_wq = [wp]
        nbr = wp
        while nbr != wq:
            # Get next neighbor (clockwise on the outer face)
            next_nbr = embedding[v][nbr]["ccw"]
            wp_wq.append(next_nbr)
            # Update outer face
            outer_face_cw_nbr[nbr] = next_nbr
            outer_face_ccw_nbr[next_nbr] = nbr
            # Move to next neighbor of v
            nbr = next_nbr

        if len(wp_wq) == 2:
            # There was a chord between wp and wq, decrease number of chords
            chords[wp] -= 1
            if chords[wp] == 0:
                ready_to_pick.add(wp)
            chords[wq] -= 1
            if chords[wq] == 0:
                ready_to_pick.add(wq)
        else:
            # Update all chords involving w_(p+1) to w_(q-1)
            new_face_nodes = set(wp_wq[1:-1])
            for w in new_face_nodes:
                # If we do not find a chord for w later we can pick it next
                ready_to_pick.add(w)
                for nbr in embedding.neighbors_cw_order(w):
                    if is_on_outer_face(nbr) and not is_outer_face_nbr(w, nbr):
                        # There is a chord involving w
                        chords[w] += 1
                        ready_to_pick.discard(w)
                        if nbr not in new_face_nodes:
                            # Also increase chord for the neighbor
                            # We only iterator over new_face_nodes
                            chords[nbr] += 1
                            ready_to_pick.discard(nbr)
        # Set the canonical ordering node and the list of contour neighbors
        canonical_ordering[k] = (v, wp_wq)

    return canonical_ordering


def triangulate_face(embedding, v1, v2):
    _, v3 = embedding.next_face_half_edge(v1, v2)
    _, v4 = embedding.next_face_half_edge(v2, v3)
    if v1 == v2 or v1 == v3:
        # The component has less than 3 nodes
        return
    while v1 != v4:
        # Add edge if not already present on other side
        if embedding.has_edge(v1, v3):
            # Cannot triangulate at this position
            v1, v2, v3 = v2, v3, v4
        else:
            # Add edge for triangulation
            embedding.add_half_edge_cw(v1, v3, v2)
            embedding.add_half_edge_ccw(v3, v1, v2)
            v1, v2, v3 = v1, v3, v4
        # Get next node
        _, v4 = embedding.next_face_half_edge(v2, v3)


def triangulate_embedding(embedding, fully_triangulate=True):
    if len(embedding.nodes) <= 1:
        return embedding, list(embedding.nodes)
    embedding = nx.PlanarEmbedding(embedding)

    # Get a list with a node for each connected component
    component_nodes = [next(iter(x)) for x in nx.connected_components(embedding)]

    # 1. Make graph a single component (add edge between components)
    for i in range(len(component_nodes) - 1):
        v1 = component_nodes[i]
        v2 = component_nodes[i + 1]
        embedding.connect_components(v1, v2)

    # 2. Calculate faces, ensure 2-connectedness and determine outer face
    outer_face = []  # A face with the most number of nodes
    face_list = []
    edges_visited = set()  # Used to keep track of already visited faces
    for v in embedding.nodes():
        for w in embedding.neighbors_cw_order(v):
            new_face = make_bi_connected(embedding, v, w, edges_visited)
            if new_face:
                # Found a new face
                face_list.append(new_face)
                if len(new_face) > len(outer_face):
                    # The face is a candidate to be the outer face
                    outer_face = new_face

    # 3. Triangulate (internal) faces
    for face in face_list:
        if face is not outer_face or fully_triangulate:
            # Triangulate this face
            triangulate_face(embedding, face[0], face[1])

    if fully_triangulate:
        v1 = outer_face[0]
        v2 = outer_face[1]
        v3 = embedding[v2][v1]["ccw"]
        outer_face = [v1, v2, v3]

    return embedding, outer_face


def make_bi_connected(embedding, starting_node, outgoing_node, edges_counted):
    # Check if the face has already been calculated
    if (starting_node, outgoing_node) in edges_counted:
        # This face was already counted
        return []
    edges_counted.add((starting_node, outgoing_node))

    # Add all edges to edges_counted which have this face to their left
    v1 = starting_node
    v2 = outgoing_node
    face_list = [starting_node]  # List of nodes around the face
    face_set = set(face_list)  # Set for faster queries
    _, v3 = embedding.next_face_half_edge(v1, v2)

    # Move the nodes v1, v2, v3 around the face:
    while v2 != starting_node or v3 != outgoing_node:
        if v1 == v2:
            raise nx.NetworkXException("Invalid half-edge")
        # cycle is not completed yet
        if v2 in face_set:
            # v2 encountered twice: Add edge to ensure 2-connectedness
            embedding.add_half_edge_cw(v1, v3, v2)
            embedding.add_half_edge_ccw(v3, v1, v2)
            edges_counted.add((v2, v3))
            edges_counted.add((v3, v1))
            v2 = v1
        else:
            face_set.add(v2)
            face_list.append(v2)

        # set next edge
        v1 = v2
        v2, v3 = embedding.next_face_half_edge(v2, v3)

        # remember that this edge has been counted
        edges_counted.add((v1, v2))

    return face_list