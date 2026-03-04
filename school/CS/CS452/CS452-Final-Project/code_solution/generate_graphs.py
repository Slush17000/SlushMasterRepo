# CS452 Final Project - Traveling Salesman Problem
# Josh Derrow, Brennan Krutis, & AJ Bushman
# Algorithm runtime comparison

import matplotlib.pyplot as plt
import numpy as np

def create_graphs():
    plt.style.use('dark_background')

    # Data
    # 13-Node Data
    short_x = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

    optimal_runtimes = [0.000004, 0.000024, 0.000102, 0.00072, 
                        0.005858, 0.051621, 0.517491, 5.596141, 
                        68.232978, 902.166236, 12658.96187]
    optimal_shortest_paths = [12, 30, 12, 50, 32, 81, 78, 67, 76, 83, 104]

    short_nn_runtimes = [0.000031, 0.000034, 0.000044, 0.000053, 
                        0.000062, 0.000075, 0.000094, 0.000112, 
                        0.000132, 0.000169, 0.000188]
    short_nn_shortest_paths = [12, 30, 12, 50, 32, 82, 78, 67, 77, 85, 116]

    short_christo_runtimes = [0.002426, 0.002554, 0.002653, 0.002768,
                            0.002771, 0.003243, 0.003213, 0.00316,
                            0.003494, 0.003807, 0.003994]
    short_christo_shortest_paths = [12, 30, 18, 62, 35, 85, 86, 70, 77, 90, 99]

    # 15-Node Data
    long_x = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

    long_nn_runtimes = [0.000031, 0.000034, 0.000044, 0.000053, 
                        0.000062, 0.000075, 0.000094, 0.000112, 
                        0.000132, 0.000169, 0.000188, 0.000206, 
                        0.000241]
    # long_nn_shortest_paths = [12, 30, 12, 50, 32, 82, 78, 67, 77, 85, 116, 291, 299]

    long_christo_runtimes = [0.002426, 0.002554, 0.002653, 0.002768,
                            0.002771, 0.003243, 0.003213, 0.00316,
                            0.003494, 0.003807, 0.003994, 0.004432,
                            0.005274]
    # long_christo_shortest_paths = [12, 30, 18, 62, 35, 85, 86, 70, 77, 90, 99, 334, 351]

    # Plot 1: Wallclock of Optimal Solution
    plt.plot(short_x, optimal_runtimes, color='r', marker='o', linestyle='dashed', label='Optimal')
    plt.title("Wallclock of Optimal Solution")
    plt.xlabel("Input size (n)")
    plt.ylabel("Runtime (seconds)")
    plt.show()

    # Plot 2: Wallclock of Nearest Neighbor Approximation Solution
    plt.plot(long_x, long_nn_runtimes, color='b', marker='o', linestyle='dashed', label='Nearest Neighbor')
    plt.title("Wallclock of Nearest Neighbor Approximation Solution")
    plt.xlabel("Input size (n)")
    plt.ylabel("Runtime (seconds)")
    plt.show()

    # Plot 3: Wallclock of Christofides Approximation Solution
    plt.plot(long_x, long_christo_runtimes, color='m', marker='o', linestyle='dashed', label='Christofides')
    plt.title("Wallclock of Christofides Approximation Solution")
    plt.xlabel("Input size (n)")
    plt.ylabel("Runtime (seconds)")
    plt.show()

    # Plot 4: Comparison of Nearest Neighbor & Christofides Wallclocks
    plt.plot(long_x, long_nn_runtimes, color='b', marker='o', linestyle='dashed', label='Nearest Neighbor')
    plt.plot(long_x, long_christo_runtimes, color='m', marker='o', linestyle='dashed', label='Christofides')
    plt.title("Comparison of Nearest Neighbor & Christofides Wallclocks")
    plt.xlabel("Input size (n)")
    plt.ylabel("Runtime (seconds)")
    plt.legend()
    plt.show()

    # Plot 5: Comparison of All Wallclocks
    plt.plot(short_x, optimal_runtimes, color='r', marker='o', linestyle='dashed', label='Optimal')
    plt.plot(short_x, short_nn_runtimes, color='b', marker='o', label='Nearest Neighbor')
    plt.plot(short_x, short_christo_runtimes, color='m', marker='o', linestyle='dashed', label='Christofides')
    plt.title("Comparison of All Wallclocks")
    plt.xlabel("Input size (n)")
    plt.ylabel("Runtime (seconds)")
    plt.legend()
    plt.show()
        
    # Plot 6: Comparison of All Shortest Paths
    x = np.arange(len(short_x))
    width = .25
    bars_optimal = plt.bar(x - width, optimal_shortest_paths, width, label='Optimal', color='r')
    bars_nn = plt.bar(x, short_nn_shortest_paths, width, label='Nearest Neighbor', color='b')
    bars_christo = plt.bar(x + width, short_christo_shortest_paths, width, label='Christofides', color='m')
    for bar in bars_optimal:
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f'{bar.get_height():.0f}',
                ha='center', va='bottom', fontsize=8, color='white')
    for bar in bars_nn:
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f'{bar.get_height():.0f}',
                ha='center', va='bottom', fontsize=8, color='white')
    for bar in bars_christo:
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(), f'{bar.get_height():.0f}',
                ha='center', va='bottom', fontsize=8, color='white')
    plt.title("Comparison of All Shortest Paths")
    plt.xlabel("Input size (n)")
    plt.xticks(x, short_x)
    plt.ylabel("Length of Shortest Path")
    plt.legend()
    plt.show()
