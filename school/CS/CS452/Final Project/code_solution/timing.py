# CS452 Final Project - Traveling Salesman Problem
# Josh Derrow, Brennan Krutis, & AJ Bushman
# Algorithm runtime calculator

import time

def time_function(function, vertices, edges, reps=10):
  min_time = float("inf")
  result = None
  for i in range(reps):
    start = time.perf_counter()
    result = function(vertices, edges)
    end = time.perf_counter()
    min_time = min(min_time, end - start)
  return (min_time, result)
