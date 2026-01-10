/*
 * CS 470 Example
 *
 * Demonstrates the OpenMP atomic directive.
 */

#include <stdio.h>
#include <omp.h>

int main ()
{
    int nthreads = 0;

#   pragma omp parallel
    {
#       pragma omp atomic
        nthreads++;
    }

    printf("Nthreads=%d\n", nthreads);
    return 0;
}

