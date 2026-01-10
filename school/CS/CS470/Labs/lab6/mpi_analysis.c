/*
 * mpi_analysis.c
 *
 * CS 470 MPI Analysis Lab
 * Parallel MPI version.
 *
 * Name(s): Josh Derrow & Brennan Krutis
 * 
 * Data: https://docs.google.com/spreadsheets/d/18Wsip6vO1rdF83OdagYbgEnXXWaMzUZNeoG5lHPIYaI/edit?usp=sharing
 * 
 * Analysis:
 *      We added one relavant MPI Function call for each subroutine to achieve parallelization:
 *          randomize: MPI_Scatter
 *          histogram: MPI_Reduce
 *          shift_left: MPI_Sendrecv
 * 
 * Does your solution scale well? Does it exhibit strong or weak scaling (or both)? How does the performance compare to the serial version? 
 *      The MPI solution scales well, demonstrating strong (almost linear) scaling as the execution time for the histogram and shift 
 *      subroutines nearly halves when the number of processes doubles. Compared to the serial version, the MPI version shows clear 
 *      performance gains for communication-intensive tasks, while the randomization subroutine—which is more compute-bound—shows less 
 *      improvement.
 * 
 * How do the answers to these questions change for the different subroutines, and what causes those variations? 
 *      The histogram and shift subroutines benefit greatly from parallelization due to the MPI operations, 
 *      whereas the random number generation is less affected since it involves mostly local computations.
 * 
 * What trends do you see as you vary the number of MPI processes, the random number count, and the shift offset? What do you think is the reason for these trends?
 *      Based on the data gathered, we have determined that not only does the number of MPI processes affect the execution time, but so does the random number 
 *      count and shift offset. Increasing the number of MPI processes generally leads to a decrease in execution time for the histogram and shift subroutines, 
 *      but does not decrease the execution time for the randomize subroutine. While on the other hand, increasing the random number count and shift offset 
 *      generally increases the execution time for all three subroutines. This is because as the number of random numbers increases, the amount of data that 
 *      needs to be generated also increases, resulting in an increased computational load.
 * 
 * Which of the three main subroutines are more compute-bound and which are more communication-bound? Do any subroutines shift characteristics during execution? How do you know this?
 *      Out of the three subroutines, shift_left is the most communication bound, as the main behavior in this function is MPI_Sendrecv; this remains communication-bound throughout 
 *      the execution. Between the remaining two subroutines, although both of them seem to exhibit compute-bound behavior in the beginning stage (RNG, local bin counting) and shift 
 *      to being communication-bound later in execution (MPI_Scatter, MPI_Reduce), histogram seems to be the more compute-bound function out of them. This is exemplified by the fact 
 *      that in the histogram function, each local process is performing significant computation before reaching the communication step.
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <mpi.h>

// histogram bins
#define BINS 10

// maximum random number
#define RMAX 1000

// limit debug output
#define MAX_DEBUG_COUNT 32

// timing macros
#define START_TIMER(NAME) MPI_Barrier(MPI_COMM_WORLD); \
    double NAME ## _time, NAME ## _local_time = MPI_Wtime();
#define STOP_TIMER(NAME) NAME ## _local_time = MPI_Wtime() - (NAME ## _local_time); \
    MPI_Reduce(&(NAME ## _local_time), &(NAME ## _time), 1, MPI_DOUBLE, MPI_MAX, 0, MPI_COMM_WORLD);
#define GET_TIMER(NAME) (NAME ## _time)

// "count_t" used for number counts that could become quite high
typedef unsigned long count_t;

int my_rank;          // local MPI task number
int nprocs;           // total MPI tasks (must be power of two)
int *nums;            // random numbers
count_t  global_n;    // global "nums" count (must be divisible by "nprocs")
count_t  local_n;     // local "nums" count
count_t  shift_n;     // global left shift offset
count_t *hist;        // histogram (counts of "nums" in bins)

/*
 * Parse and handle command-line parameters. Returns true if parameters were
 * valid; false if not.
 */
bool parse_command_line(int argc, char *argv[])
{
    // read command-line parameters
    if (argc != 3) {
        if (my_rank == 0) {
            printf("Usage: %s <n> <shift>\n", argv[0]);
        }
        return false;
    } else {
        global_n = strtol(argv[1], NULL, 10);
        shift_n  = strtol(argv[2], NULL, 10);
    }

    // check process count
    if (nprocs < 0 || nprocs & (nprocs - 1)) {
        if (my_rank == 0) {
            printf("ERROR: Process count must be a positive power of two\n");
        }
        return false;
    }

    // check divisibility
    if (global_n % nprocs != 0) {
        if (my_rank == 0) {
            printf("ERROR: N must be evenly divisible by nprocs\n");
        }
        return false;
    }

    // check shift offset
    if (shift_n > global_n / nprocs) {
        if (my_rank == 0) {
            printf("ERROR: shift offset cannot be greater than N/nprocs\n");
        }
        return false;
    }

    return true;
}

/*
 * Allocate and initialize number array and histogram.
 */
void initialize_data_structures(size_t num_count)
{
    // initialize local data structures
    nums = (int*)calloc(num_count, sizeof(int));
    if (nums == NULL) {
        fprintf(stderr, "Out of memory!\n");
        exit(EXIT_FAILURE);
    }
    hist = (count_t*)calloc(BINS, sizeof(count_t));
    if (hist == NULL) {
        fprintf(stderr, "Out of memory!\n");
        exit(EXIT_FAILURE);
    }
}

/*
 * Print contents of an int list.
 */
void print_nums(int *a, count_t n)
{
    for (count_t i = 0; i < n; i++) {
        printf("%3d ", a[i]);
    }
}

/*
 * Print contents of global list.
 */
void print_global_nums()
{
    int *tmp = (int*)malloc(sizeof(int) * global_n);
    if (tmp == NULL) {
        fprintf(stderr, "Out of memory!\n");
        exit(EXIT_FAILURE);
    }
    MPI_Gather(nums, local_n, MPI_INT,
                tmp, local_n, MPI_INT, 0, MPI_COMM_WORLD);
    if (my_rank == 0) {
        print_nums(tmp, global_n);
    }
    free(tmp);
}

/*
 * Print contents of a count list (i.e., histogram).
 */
void print_counts(count_t *a, count_t n)
{
    for (count_t i = 0; i < n; i++) {
        printf("%lu ", a[i]);
    }
}

/*
 * Generate random integers for "nums".
 */
void randomize()
{
    int *tmp = (int*)malloc(sizeof(int) * global_n);
    if (tmp == NULL) {
        fprintf(stderr, "Out of memory!\n");
        exit(EXIT_FAILURE);
    }
    if (my_rank == 0) {
        srand(42);
        for (count_t i = 0; i < global_n; i++) {
            tmp[i] = rand() % RMAX;
        }
    }
    MPI_Scatter(tmp, local_n, MPI_INT,
                nums, local_n, MPI_INT, 0, MPI_COMM_WORLD);
    free(tmp);
}

/*
 * Calculate histogram based on contents of "nums".
 */
void histogram()
{
    count_t tmp[BINS];
    memset(tmp, 0, sizeof(count_t) * BINS);
    for (count_t i = 0; i < local_n; i++) {
        tmp[nums[i] % BINS]++;
    }
    MPI_Reduce(tmp, hist, BINS, MPI_UNSIGNED_LONG, MPI_SUM, 0, MPI_COMM_WORLD);
}

/*
 * Shift "nums" left by the given number of slots. Anything shifted off the left
 * side should rotate around to the end, so no numbers are lost.
 */
void shift_left()
{
    // preserve first shift_n values
    int *tmp = (int*)malloc(sizeof(int) * shift_n);
    if (tmp == NULL) {
        fprintf(stderr, "Out of memory!\n");
        exit(EXIT_FAILURE);
    }
    for (count_t i = 0; i < shift_n; i++) {
        tmp[i] = nums[i];
    }

    // perform local shift
    for (count_t i = 0; i < local_n-shift_n; i++) {
        nums[i] = nums[(i + shift_n) % local_n];
    }

    // "rotate" first shift_n values around to the other end by
    // exchanging values between adjacent ranks
    MPI_Sendrecv(tmp, shift_n, MPI_INT, (my_rank - 1 + nprocs) % nprocs, 0,
                 nums + local_n - shift_n, shift_n, MPI_INT,
                 (my_rank + 1 + nprocs) % nprocs, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
    
    free(tmp);
}

int main(int argc, char *argv[])
{
    // initialize MPI
    MPI_Init(&argc, &argv);
    MPI_Comm_size(MPI_COMM_WORLD, &nprocs);
    MPI_Comm_rank(MPI_COMM_WORLD, &my_rank);

    if (!parse_command_line(argc, argv)) {
        MPI_Finalize();
        exit(EXIT_FAILURE);
    }

    // calculate local N
    local_n = global_n / nprocs;

    initialize_data_structures(local_n);

    // initialize random numbers
    START_TIMER(rand)
    randomize();
    STOP_TIMER(rand)

    if (global_n <= MAX_DEBUG_COUNT) {
        if (my_rank == 0) printf("\nDEBUG original list: ");
        print_global_nums();
        if (my_rank == 0) printf("\n");
    }

    // compute histogram
    START_TIMER(hist)
    histogram();
    STOP_TIMER(hist)

    // perform left shift
    START_TIMER(shft)
    shift_left();
    STOP_TIMER(shft)

    if (global_n <= MAX_DEBUG_COUNT) {
        if (my_rank == 0) printf("DEBUG shifted list:  ");
        print_global_nums();
        if (my_rank == 0) printf("\n");
    }

    // print final results
    if (my_rank == 0) {
        printf("HISTOGRAM: ");
        print_counts(hist, BINS);
        printf("  NP=%03d  RAND: %7.4f  HIST: %7.4f  SHFT: %7.4f\n",
                nprocs, GET_TIMER(rand), GET_TIMER(hist), GET_TIMER(shft));
    }

    // clean up and exit
    free(nums);
    free(hist);
    MPI_Finalize();
    return EXIT_SUCCESS;
}
