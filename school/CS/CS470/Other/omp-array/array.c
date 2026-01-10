/*
 * CS 470 OpenMP Array Example
 *
 * Demonstrates basic OpenMP functionality.
 *
 */

#include <stdio.h>
#include <stdlib.h>
#include <omp.h>
#include "timer.h"

const int N = 1 << 30;
short *nums = NULL;

int main(int argc, char *argv[])
{
    /* allocate array */
    nums = (short*)malloc(sizeof(short) * N);
    if (nums == NULL) {
        printf("Out of memory!\n");
        return EXIT_FAILURE;
    }

    /* initialize array */
    START_TIMER(INIT)
#   pragma omp parallel for
    for (int i = 0; i < N; i++) {
        nums[i] = 1;
    }
    STOP_TIMER(INIT)

    /* sum array */
    START_TIMER(SUM)
    long total = 0;
#   pragma omp parallel for reduction (+:total)
    for (int i = 0; i < N; i++) {
        total += (long)nums[i];
    }
    STOP_TIMER(SUM)

    printf("Done. Sum = %10ld  INIT: %8.4fs  SUM: %8.4fs  %s\n",
            total, GET_TIMER(INIT), GET_TIMER(SUM),
            (total == 1073741824 ? "pass" : "FAIL"));

    return EXIT_SUCCESS;
}

