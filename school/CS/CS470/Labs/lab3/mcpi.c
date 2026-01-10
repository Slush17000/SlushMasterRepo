/**
 * mc_pi.c
 *
 * CS 470 OpenMP Lab
 * Based on IPP Programming Assignment 5.2
 *
 * Names: Josh Derrow & Brennan Krutis
 * 
 * Analysis:
 * Write a short analysis and discussion (1-2 paragraphs) describing your changes and the results. Include some experimental results. 
 * How well does your new version scale? Are the estimates of π accurate? How difficult was it to parallelize with OpenMP compared 
 * to Pthreads? Does one of them perform better than the other?
 *   First, we added directives to parallelize the throw_darts method as a reduction. Then, we added directives to paralleize the seed 
 *   generator for loop. It seems to exhibit linear-strong scaling, as the runtime halves each time the number of threads is doubled. 
 *   The estimates of Pi were somewhat accurate for a low number of threads, but as the number of threads increased, the estimates of Pi 
 *   became less accurate. It was way less difficult to parallelize with OpenMP than Pthreads. The OpenMP version required only a few lines of straightforward 
 *   code, so it was also easier to read and understand than the Pthread version. Both of the versions performed similarly (runtime and 
 *   speedup almost identical), but the OpenMP Pi estimations were not as accurate as the Pthread Pi estimations. So overall, the Pthread 
 *   version performs better at the cost of implementation complexity.
 *   Link to data: https://docs.google.com/spreadsheets/d/1fNGwpQL5mZ5aK7V6cTBphBE-uLWO4zXTrjfnW_goBpI/edit?usp=sharing
 * 
 * Why is putting an omp critical directive around the darts_in_circle increment not a sufficient solution to handle synchronization 
 * between threads? What does this directive correspond to in the Pthreads version of this lab?
 *   Putting an critical directive around the darts_in_circle increment is insufficient because even though it accurately approximates Pi, 
 *   it causes the runtime to skyrocket, and the speedup to drop. This is because the critical directive forces all threads to wait for each
 *   other to increment darts_in_circle, which causes a bottleneck. This is similar to using a mutex in the Pthread version, which also causes
 *   a bottleneck.
 * 
 * Suppose that some darts were more “difficult” to throw than others (e.g., significantly more computation is required), and that 
 * it is not possible to determine ahead of time which of the darts are “difficult.” Write 1-2 paragraphs explaining why this could 
 * pose a challenge for the OpenMP parallelization and describe a feature of OpenMP that would help in this scenario. Is this 
 * complication also a problem for the Pthreads version? 
 *   This could pose a challenge for the OpenMP parallelization because if some darts take significantly longer to throw than others,
 *   the threads would be waiting for the longest dart to finish before they could start throwing their darts. This would cause a bottleneck
 *   and would not be an efficient use of the threads. A feature of OpenMP that would help in this scenario is dynamic scheduling, which would
 *   allow the threads to take on new darts as they finish their current darts. This would help to balance the load between the threads and 
 *   reduce the bottleneck. This complication is also a problem for the Pthreads version, as the threads would still be waiting for the longest
 *   dart to finish before they could start throwing their darts.
 */

#include <limits.h>
#include <stdio.h>
#include <stdlib.h>
#include <omp.h>

#include "timer.h"

long total_darts = 0;           // dart count
long darts_in_circle = 0;       // number of hits

void throw_darts()
{
    #ifdef _OPENMP
    #pragma omp parallel default(none) shared(total_darts) reduction(+:darts_in_circle)
    #endif 
    {
        // seed pseudo-random number generator
        unsigned long seed = 0;

        #ifdef _OPENMP
        #pragma omp for
        #endif 
        for (long dart = 0; dart < total_darts; dart++) {

            // throw a dart by generating a random (x,y) coordinate pair
            // using a basic linear congruential generator (LCG) algorithm
            // (see https://en.wikipedia.org/wiki/Linear_congruential_generator)
            //
            seed = (1103515245*seed + 12345) % (1<<31);
            double x = (double)seed / (double)ULONG_MAX;
            seed = (1103515245*seed + 12345) % (1<<31);
            double y = (double)seed / (double)ULONG_MAX;
            double dist_sq = x*x + y*y;

            // update hit tracker
                if (dist_sq <= 1.0) {
                    darts_in_circle++;
                }
        }
    }
}

int main(int argc, char* argv[])
{
    // check and parse command-line arguments
    if (argc != 2) {
        printf("Usage: %s <num-darts>\n", argv[0]);
        exit(EXIT_FAILURE);
    }
    total_darts = strtoll(argv[1], NULL, 10);

    START_TIMER(darts)

    // simulate dart throws
    throw_darts();

    STOP_TIMER(darts)

    // calculate pi
    double pi_est = 4 * darts_in_circle / ((double)total_darts);
    printf("Estimated pi: %e   Time elapsed: %.3lfs\n",
            pi_est, GET_TIMER(darts));

    // clean up
    return EXIT_SUCCESS;
}
