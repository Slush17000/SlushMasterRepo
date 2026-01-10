/*
 * CS 470 Example
 *
 * Demonstrates loop scheduling in OpenMP.
 */

#include <stdio.h>
#include <stdlib.h>
#include <omp.h>

int main (int argc, char *argv[])
{
#   pragma omp parallel for num_threads(4)
    for (int i = 0; i < 32; i++) {
        printf("Iteration %02d on thread %d\n", i, omp_get_thread_num());
    }

    return EXIT_SUCCESS;
}
