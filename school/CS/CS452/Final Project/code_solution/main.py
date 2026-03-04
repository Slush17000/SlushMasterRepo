# CS452 Final Project - Traveling Salesman Problem
# Josh Derrow, Brennan Krutis, & AJ Bushman
# Optimal & approximate solution driver

import sys
import nearest_neighbor
import christofides
import networkx as nx
import matplotlib.pyplot as plt
from itertools import permutations
from timing import time_function
from generate_graphs import create_graphs


def parse_graph_input(input_string):
    data = input_string.strip().split("\n")
    n, _ = map(int, data[0].split())
    edges = {}
    vertices = set()
    
    for i in range(1, len(data)):
        u, v, w = data[i].split()
        w = int(w)
        edges[(u, v)] = w
        edges[(v, u)] = w
        vertices.add(u)
        vertices.add(v)
    
    return n, edges, list(vertices)

def solve_tsp(vertices, edges):
    min_cost = float("inf")
    best_path = []
    
    for perm in permutations(vertices):
        cost = 0
        is_valid = True
        for i in range(len(perm)):
            u = perm[i]
            v = perm[(i + 1) % len(perm)]
            if (u, v) in edges:
                cost += edges[(u, v)]
            else:
                is_valid = False
                break
        
        if is_valid and cost < min_cost:
            min_cost = cost
            best_path = list(perm)
    
    if best_path:
        best_path.append(best_path[0])
    
    return min_cost, best_path

def visualize_tsp(edges, path):
    G = nx.Graph()
    
    for (u, v), w in edges.items():
        G.add_edge(u, v, weight=w)
    
    pos = nx.spring_layout(G)
    nx.draw(G, pos, with_labels=True, node_color="lightblue", node_size=2000, font_size=10)
    edge_labels = nx.get_edge_attributes(G, 'weight')
    
    tsp_edges = [(path[i], path[i+1]) for i in range(len(path) - 1)]
    nx.draw_networkx_edges(G, pos, edgelist=tsp_edges, edge_color='red', width=2)
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_size=8)
    plt.show()

if __name__ == "__main__":
    f = open(sys.argv[1])
    input_list = f.readlines();

    input_string = ""
    for string in input_list:
        input_string += string
    print(f"Input Graph String:\n{input_string}\n")
    
    # Parse graph input
    n, edges, vertices = parse_graph_input(input_string)
    
    # Optimal Solution
    (alg_time, (length, path)) = time_function(
        solve_tsp, vertices, edges, reps=1)

    print(f"Total execution time of optimal algorithm: {alg_time:.6f} seconds")
    print(f"Optimal TSP length: {length}")
    print(f"Optimal TSP path: {' -> '.join(path)}\n")

    visualize_tsp(edges, path)
    
    # Nearest Neighbor Approximation Solution
    (alg_time, (length, path)) = time_function(
        nearest_neighbor.nearest_neighbor_tsp, vertices, edges, reps=1)

    print(f"Total execution time of Nearest Neighbor algorithm: {alg_time:.6f} seconds")
    print(f"Nearest Neighbor TSP length: {length}")
    print(f"Nearest Neighbor TSP path: {' -> '.join(path)}\n")

    visualize_tsp(edges, path)
    
    # Christofides Approximation Solution
    (alg_time, (length, path)) = time_function(
        christofides.christofides_tsp, vertices, edges, reps=1)

    print(f"Total execution time of Christofides algorithm: {alg_time:.6f} seconds")
    print(f"Christofides TSP length: {length}")
    print(f"Christofides TSP path: {' -> '.join(path)}\n")

    visualize_tsp(edges, path)
    
    create_graphs()
