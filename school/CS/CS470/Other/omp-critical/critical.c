/*
 * CS 470 OpenMP Critical/Single/Master Example
 *
 * Demonstrates basic OpenMP sync functionality.
 *
 */

#include <stdio.h>
#include <stdlib.h>
#include <omp.h>

int main(int argc, char *argv[])
{
#ifdef _OPENMP
#   pragma omp parallel
    {
#       pragma omp critical
        printf("Critical! tid=%d\n", omp_get_thread_num());

#       pragma omp barrier

#       pragma omp single nowait
        printf("Single! tid=%d\n", omp_get_thread_num());

#       pragma omp master
        printf("Master! tid=%d\n", omp_get_thread_num());
    }
#endif

    printf("Goodbye!\n");
    return EXIT_SUCCESS;
}

