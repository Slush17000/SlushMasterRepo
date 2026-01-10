/*
 * CS 470 Example
 *
 * Demonstrates task parallelism in OpenMP.
 */

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <omp.h>

typedef int data_t;

int cmp(data_t a, data_t b)
{
    return a - b;
}

#define SWAP(A,I,J) { data_t tmp = (A)[(I)]; (A)[(I)] = (A)[(J)]; (A)[(J)] = tmp; }

void insertion_sort(data_t items[], size_t n)
{
    for (size_t i = 1; i < n; i++) {
        for (size_t j = i; j > 0 && cmp(items[j-1], items[j]) > 0; j--) {
            SWAP(items, j, j-1);
        }
    }
}

void quick_sort(data_t items[], size_t n)
{
    // base case: an array of size 0 or 1 is already sorted
    if (n < 2) {
        return;
    }

    // base case: fewer than one hundred items; just use insertion sort
    if (n < 100) {
        insertion_sort(items, n);
        return;
    }

    // select middle value as pivot
    data_t pivot = items[n/2];

    int j = 0;      // current index
    int p = -1;     // index of last item in left partition
    int q = n;      // index of first item in right partition

    // partition array
    while (j < q) {
        if (cmp(items[j], pivot) < 0) {
            p++;
            SWAP(items, j, p);       // move item j into left partition
            j++;
        } else if (cmp(items[j], pivot) > 0) {
            q--;
            SWAP(items, j, q);       // move item j into right partition
        } else {
            j++;
        }
    }

    // recursively sort each partition
#   pragma omp task
    quick_sort(items, p+1);
#   pragma omp task
    quick_sort(items+q, n-q);
#   pragma omp taskwait
}

void print_ints(int items[], size_t n)
{
    // print an array of integers
    for (size_t i = 0; i < n; i++) {
        if (i > 0) {
            printf(",");
        }
        printf("%d", items[i]);
    }
    printf("\n");
}

int main()
{
    // seed random number generator
    srand((unsigned)time(NULL));

    // generate random data
	/*int n = 20;         // small data set (for correctness testing)*/
	int n = 5000000;    // large data set (for performance testing)
	data_t *items = (data_t*)malloc(sizeof(data_t) * n);
    for (size_t i = 0; i < n; i++) {
        items[i] = rand() % n;
    }

	// run the sort and time it
    double begin, end;
	begin = omp_get_wtime();
#   pragma omp parallel
#   pragma omp single nowait
	quick_sort(items, n);
	end = omp_get_wtime();

    // print results
	/*print_ints(items, n);*/
    printf("Time=%6.4fs\n", end-begin);

	// clean up
	free(items);
	return EXIT_SUCCESS;
}
