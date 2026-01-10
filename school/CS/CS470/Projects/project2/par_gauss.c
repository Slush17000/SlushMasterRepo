/*
 * par_gauss_openmp.c
 *
 * CS 470 Project 2 (OpenMP)
 * OpenMP parallelized version with default(none)
 *
 * Compile with: gcc -fopenmp --std=c99 -o par_gauss_openmp par_gauss_openmp.c
 * 
 * Data: https://docs.google.com/spreadsheets/d/1OB0ARcbFucNPtv7X842Xgk24yxYfucTw08ly7XkuMhQ/edit?usp=sharing 
 * Analysis: https://docs.google.com/document/d/1W3pJE2hWv0JBqKsopbZQ8YmH7wf8GRinNJ4OLqf4E44/edit?usp=sharing 
 */

#include <getopt.h>
#include <limits.h>
#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <omp.h> // OpenMP header

// custom timing macros
#include "timer.h"

// uncomment this line to enable the alternative back substitution method
#define USE_COLUMN_BACKSUB

// use 64-bit IEEE arithmetic (change to "float" to use 32-bit arithmetic)
#define REAL double

// linear system: Ax = b    (A is n x n matrix; b and x are n x 1 vectors)
int n;
REAL *A;
REAL *x;
REAL *b;

// enable/disable debugging output (don't enable for large matrix sizes!)
bool debug_mode = false;

// enable/disable triangular mode (to skip the Gaussian elimination phase)
bool triangular_mode = false;

/*
 * Generate a random linear system of size n.
 */
void rand_system()
{
    // allocate space for matrices
    A = (REAL *)calloc(n * n, sizeof(REAL));
    b = (REAL *)calloc(n, sizeof(REAL));
    x = (REAL *)calloc(n, sizeof(REAL));

    if (A == NULL || b == NULL || x == NULL)
    {
        printf("Unable to allocate memory for linear system\n");
        exit(EXIT_FAILURE);
    }

    // Parallelize over rows; each thread uses its own local seed.
    #pragma omp parallel for default(none) shared(n, A, triangular_mode)
    for (int row = 0; row < n; row++)
    {
        unsigned long local_seed = row;
        int start = (triangular_mode ? row : 0);
        for (int col = start; col < n; col++)
        {
            if (row != col)
            {
                local_seed = (1103515245 * local_seed + 12345) % (1 << 31);
                A[row * n + col] = (REAL)local_seed / (REAL)ULONG_MAX;
            }
            else
            {
                A[row * n + col] = n / 10.0;
            }
        }
    }

    // Compute right-hand side vector b in parallel.
    #pragma omp parallel for default(none) shared(n, A, b, x)
    for (int row = 0; row < n; row++)
    {
        REAL sum = 0.0;
        for (int col = 0; col < n; col++)
        {
            sum += A[row * n + col];
        }
        b[row] = sum;
        x[row] = 0.0;
    }
}

/*
 * Reads a linear system of equations from a file in the form of an augmented
 * matrix [A][b].  (This function remains serial.)
 */
void read_system(const char *fn)
{
    FILE *fin = fopen(fn, "r");
    if (fin == NULL)
    {
        printf("Unable to open file \"%s\"\n", fn);
        exit(EXIT_FAILURE);
    }
    if (fscanf(fin, "%d\n", &n) != 1)
    {
        printf("Invalid matrix file format\n");
        exit(EXIT_FAILURE);
    }

    A = (REAL *)malloc(sizeof(REAL) * n * n);
    b = (REAL *)malloc(sizeof(REAL) * n);
    x = (REAL *)malloc(sizeof(REAL) * n);

    if (A == NULL || b == NULL || x == NULL)
    {
        printf("Unable to allocate memory for linear system\n");
        exit(EXIT_FAILURE);
    }

    for (int row = 0; row < n; row++)
    {
        for (int col = 0; col < n; col++)
        {
            if (fscanf(fin, "%lf", &A[row * n + col]) != 1)
            {
                printf("Invalid matrix file format\n");
                exit(EXIT_FAILURE);
            }
        }
        if (fscanf(fin, "%lf", &b[row]) != 1)
        {
            printf("Invalid matrix file format\n");
            exit(EXIT_FAILURE);
        }
        x[row] = 0.0;
    }
    fclose(fin);
}

/*
 * Performs Gaussian elimination on the linear system.
 * Assumes the matrix is non-singular and doesn't require any pivoting.
 */
void gaussian_elimination()
{
    for (int pivot = 0; pivot < n; pivot++)
    {
        #pragma omp parallel for default(none) shared(n, A, b, pivot)
        for (int row = pivot + 1; row < n; row++)
        {
            REAL coeff = A[row * n + pivot] / A[pivot * n + pivot];
            A[row * n + pivot] = 0.0;
            for (int col = pivot + 1; col < n; col++)
            {
                A[row * n + col] -= A[pivot * n + col] * coeff;
            }
            b[row] -= b[pivot] * coeff;
        }
    }
}

/*
 * Performs backwards substitution on the linear system.
 * (Row-oriented version)
 */
void back_substitution_row()
{
    REAL tmp;
    for (int row = n - 1; row >= 0; row--)
    {
        tmp = b[row];
        #pragma omp parallel for default(none) shared(n, A, x, row) reduction(+ : tmp)
        for (int col = row + 1; col < n; col++)
        {
            tmp += -A[row * n + col] * x[col];
        }
        x[row] = tmp / A[row * n + row];
    }
}

/*
 * Performs backwards substitution on the linear system.
 * (Column-oriented version)
 */
void back_substitution_column()
{
    int row, col;
    // Create a single parallel region that spans the whole back substitution.
    #pragma omp parallel default(none) shared(n, A, b, x) private(row, col)
    {
        // Initialize x with b in parallel.
        #pragma omp for
        for (row = 0; row < n; row++)
        {
            x[row] = b[row];
        }

        // Process each column in reverse order.
        for (col = n - 1; col >= 0; col--)
        {
            // Only one thread divides x[col] by A[col*n + col].
            #pragma omp single
            {
                x[col] /= A[col * n + col];
            }
            // Now update the rows above the current column in parallel.
            #pragma omp for
            for (row = 0; row < col; row++)
            {
                x[row] -= A[row * n + col] * x[col];
            }
            // Make sure all threads finish updating before moving to the next col.
            #pragma omp barrier
        }
    }
}

/*
 * Find the maximum error in the solution (only works for randomly-generated
 * matrices where the solution is expected to be all 1s).
 */
REAL find_max_error()
{
    REAL error = 0.0, tmp;
    for (int row = 0; row < n; row++)
    {
        tmp = fabs(x[row] - 1.0);
        if (tmp > error)
        {
            error = tmp;
        }
    }
    return error;
}

/*
 * Prints a matrix to standard output in a fixed-width format.
 */
void print_matrix(REAL *mat, int rows, int cols)
{
    for (int row = 0; row < rows; row++)
    {
        for (int col = 0; col < cols; col++)
        {
            printf("%8.1e ", mat[row * cols + col]);
        }
        printf("\n");
    }
}

int main(int argc, char *argv[])
{
    int c;
    while ((c = getopt(argc, argv, "dt")) != -1)
    {
        switch (c)
        {
        case 'd':
            debug_mode = true;
            break;
        case 't':
            triangular_mode = true;
            break;
        default:
            printf("Usage: %s [-dt] <file|size>\n", argv[0]);
            exit(EXIT_FAILURE);
        }
    }
    if (optind != argc - 1)
    {
        printf("Usage: %s [-dt] <file|size>\n", argv[0]);
        exit(EXIT_FAILURE);
    }

    long int size = strtol(argv[optind], NULL, 10);
    START_TIMER(init)
    if (size == 0)
    {
        read_system(argv[optind]);
    }
    else
    {
        n = (int)size;
        rand_system();
    }
    STOP_TIMER(init)

    if (debug_mode)
    {
        printf("Original A = \n");
        print_matrix(A, n, n);
        printf("Original b = \n");
        print_matrix(b, n, 1);
    }

    START_TIMER(gaus)
    if (!triangular_mode)
    {
        gaussian_elimination();
    }
    STOP_TIMER(gaus)

    START_TIMER(bsub)
    #ifndef USE_COLUMN_BACKSUB
        back_substitution_row();
    #else
        back_substitution_column();
    #endif
        STOP_TIMER(bsub)

    if (debug_mode)
    {
        printf("Triangular A = \n");
        print_matrix(A, n, n);
        printf("Updated b = \n");
        print_matrix(b, n, 1);
        printf("Solution x = \n");
        print_matrix(x, n, 1);
    }

    int num_threads;

    #ifdef _OPENMP
        num_threads = omp_get_max_threads();
    #else
        num_threads = 1;
    #endif
    printf("Nthreads=%2d  ERR=%8.1e  INIT: %8.4fs  GAUS: %8.4fs  BSUB: %8.4fs\n",
           num_threads, find_max_error(),
           GET_TIMER(init), GET_TIMER(gaus), GET_TIMER(bsub));

    free(A);
    free(b);
    free(x);
    return EXIT_SUCCESS;
}
