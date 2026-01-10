/*
 * CS 470 Example
 *
 * Illustrates deadlock with nested critical sections.
 */

#include <stdio.h>
#include <stdlib.h>
#include <omp.h>

void inc_and_print(int *i)
{
    // WARNING: THIS IS GUARANTEED TO DEADLOCK!
#   pragma omp critical
    (*i)++;
    printf("i=%d\n", *i);
}

int main ()
{
    int x;
#   pragma omp parallel
    {
#       pragma omp critical
        inc_and_print(&x);
    }
    return EXIT_SUCCESS;
}
