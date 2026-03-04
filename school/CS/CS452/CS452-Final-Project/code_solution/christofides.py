# CS452 Final Project - Traveling Salesman Problem
# Josh Derrow, Brennan Krutis, & AJ Bushman
# Christofides algorithm approximate solution
# Sources used:
#   - https://www.youtube.com/watch?v=GiDsjIBOVoA
#   - https://www.youtube.com/watch?v=1pmBjIZ20pE
#   - https://en.wikipedia.org/wiki/Christofides_algorithm
#   - https://networkx.org/documentation/stable/reference/index.html
#   - https://visualgo.net/en/mst

import networkx as nx

def christofides_tsp(vertices, edges):
    path_length = 0
    G = nx.Graph()
    for (u, v), w in edges.items():
        G.add_edge(u, v, weight=w)
        
    # Find the shortest path
    tsp = nx.approximation.traveling_salesman_problem
    path = tsp(G, cycle=False, method=nx.approximation.christofides)
    path.append(path[0])
    
    # Compute the path length
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        path_length += edges.get((u, v), edges.get((v, u), float('inf')))
    
    return path_length, path
