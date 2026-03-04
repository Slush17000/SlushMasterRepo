# CS452 Final Project - Traveling Salesman Problem
# Josh Derrow, Brennan Krutis, & AJ Bushman
# Nearest Neighbor algorithm approximate solution
# Sources Used:
# https://people.hsc.edu/faculty-staff/robbk/Math111/Lectures/Fall%202016/Lecture%2033%20-%20The%20Nearest-Neighbor%20Algorithm.pdf

def nearest_neighbor_tsp(vertices, edges):
    # Returns the best path from the nearest neighbor algorithm
    shortest_path_length = float('inf')
    shortest_path = None
    for vertex in vertices:
        result = nearest_neighbor_individual(vertices, edges, vertex,
                                             shortest_path_length)
        if result != None:
            shortest_path_length, shortest_path = min((shortest_path_length,
                                                        shortest_path),
                                                      result,
                                                      key= lambda x : x[0])

    return (shortest_path_length, shortest_path)

def nearest_neighbor_individual(vertices, edges, starting_vertex, best_path):
    # Returns the path and its length starting at this vertex
    path_length = 0
    path = [starting_vertex]
    visited = set(starting_vertex)
    remaining = set(vertices)
    remaining.remove(starting_vertex)
    cur_vertex = starting_vertex
    best_next_vertex = None
    while len(remaining) > 0 and path_length < best_path:
        best_next_vertex = None
        best_next_distance = float('inf')
        for vertex in remaining:
            if vertex != cur_vertex:
                cur_distance = edges[(cur_vertex, vertex)]
                if cur_distance < best_next_distance:
                    best_next_vertex = vertex
                    best_next_distance = cur_distance
        path_length += best_next_distance
        cur_vertex = best_next_vertex
        remaining.remove(best_next_vertex)
        visited.add(best_next_vertex)
        path.append(best_next_vertex)
    if len(remaining) == 0:
        path.append(starting_vertex)
        path_length += edges[(starting_vertex, best_next_vertex)]
        return path_length, path
    else:
        return None
