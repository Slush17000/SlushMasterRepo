/*
 * CS 470 Example
 *
 * Demonstrates loop scheduling in OpenMP.
 */

#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
#include <math.h>
#include <omp.h>

double f (int i)
{
    double rval = 0.0;
    for (int j = 0; j < i; j++) {
        rval += sin((double)j);
    }
    return rval;
}

int main (int argc, char *argv[])
{
    double start, end, sum;

    // check and parse command-line arguments
    if (argc != 2) {
        printf("Usage: %s <n>\n", argv[0]);
        exit(EXIT_FAILURE);
    }
    int n = strtol(argv[1], NULL, 10);

    // serial version
    start = omp_get_wtime();
    sum = 0.0;
    for (int i = 0; i < n; i++) {
        sum += f(i);
    }
    end = omp_get_wtime();
    printf("Serial  - Sum=%8.4e    Elapsed: %8.4fs\n", sum, end-start);

    // default schedule
    start = omp_get_wtime();
    sum = 0.0;
#   pragma omp parallel for default(none) shared(n) reduction (+:sum)
    for (int i = 0; i < n; i++) {
        sum += f(i);
    }
    end = omp_get_wtime();
    printf("Default - Sum=%8.4e    Elapsed: %8.4fs\n", sum, end-start);

    return EXIT_SUCCESS;
}
