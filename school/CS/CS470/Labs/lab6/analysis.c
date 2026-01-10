/*
 * analysis.c
 *
 * CS 470 MPI Analysis Lab
 * Original serial version.
 *
 * Name(s): Josh Derrow & Brennan Krutis
 */

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>

// histogram bins
#define BINS 10

// maximum random number
#define RMAX 1000

// limit debug output
#define MAX_DEBUG_COUNT 32

// timing macros (must first declare "struct timeval tv")
#define START_TIMER(NAME) gettimeofday(&tv, NULL); \
    double NAME ## _time = tv.tv_sec+(tv.tv_usec/1000000.0);
#define STOP_TIMER(NAME) gettimeofday(&tv, NULL); \
    NAME ## _time = tv.tv_sec+(tv.tv_usec/1000000.0) - (NAME ## _time);
#define GET_TIMER(NAME) (NAME##_time)

// "count_t" used for number counts that could become quite high
typedef unsigned long count_t;

int *nums;            // random numbers
count_t  global_n;    // global "nums" count
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
        printf("Usage: %s <n> <shift>\n", argv[0]);
        return false;
    } else {
        global_n = strtol(argv[1], NULL, 10);
        shift_n  = strtol(argv[2], NULL, 10);
    }

    // check shift offset
    if (shift_n > global_n) {
        printf("ERROR: shift offset cannot be greater than N\n");
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
    print_nums(nums, global_n);
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
    srand(42);
    for (count_t i = 0; i < global_n; i++) {
        nums[i] = rand() % RMAX;
    }
}

/*
 * Calculate histogram based on contents of "nums".
 */
void histogram()
{
    for (count_t i = 0; i < global_n; i++) {
        hist[nums[i] % BINS]++;
    }
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

    // perform shift
    for (count_t i = 0; i < global_n-shift_n; i++) {
        nums[i] = nums[(i + shift_n) % global_n];
    }

    // "rotate" first shift_n values around to the other end
    for (count_t i = 0; i < shift_n; i++) {
        nums[i + global_n - shift_n] = tmp[i];
    }
    free(tmp);
}

int main(int argc, char *argv[])
{
    // utility struct for timing calls
    struct timeval tv;

    if (!parse_command_line(argc, argv)) {
        exit(EXIT_FAILURE);
    }

    initialize_data_structures(global_n);

    // initialize random numbers
    START_TIMER(rand)
    randomize();
    STOP_TIMER(rand)

    if (global_n <= MAX_DEBUG_COUNT) {
        printf("\nDEBUG original list: ");
        print_global_nums(nums, global_n);
        printf("\n");
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
        printf("DEBUG shifted list:  ");
        print_global_nums(nums, global_n);
        printf("\n");
    }

    printf("HISTOGRAM: ");
    print_counts(hist, BINS);
    printf("  NP=%03d  RAND: %7.4f  HIST: %7.4f  SHFT: %7.4f\n",
            1, GET_TIMER(rand), GET_TIMER(hist), GET_TIMER(shft));

    // clean up and exit
    free(nums);
    free(hist);
    return EXIT_SUCCESS;
}
