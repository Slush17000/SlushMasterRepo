# CS452 Final Project - Traveling Salesman Problem
# Josh Derrow, Brennan Krutis, & AJ Bushman
# Hamiltonian Cycle reduction

import sys
from main import parse_graph_input, solve_tsp, visualize_tsp
from timing import time_function

if __name__ == "__main__":
  f = open(sys.argv[1])
  input_list = f.readlines();

  input_string = ""
  for string in input_list:
      input_string += string
  print(f"Input Graph String:\n{input_string}\n")

  n, edges, vertices = parse_graph_input(input_string)

  complete_edges = {(u, v): (edges.get((u, v), 10**6)) for u in vertices for v in vertices if u != v}

  (alg_time, (length, path)) = time_function(solve_tsp, vertices, complete_edges, reps=1)

  print(f"Total execution time of reduction algorithm: {alg_time:.6f} seconds")

  if length < 10**6 * len(vertices):
      print(f"Hamiltonian Cycle exists: {' -> '.join(path)}")
      visualize_tsp(edges, path)
  else:
      print("No Hamiltonian Cycle exists.")
