#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <sys/time.h>

struct timeval tv;

// timing macros (must first declare "struct timeval tv")
#define START_TIMER(NAME) gettimeofday(&tv, NULL); \
    double NAME ## _time = tv.tv_sec+(tv.tv_usec/1000000.0);
#define STOP_TIMER(NAME) gettimeofday(&tv, NULL); \
    NAME ## _time = tv.tv_sec+(tv.tv_usec/1000000.0) - (NAME ## _time);
#define GET_TIMER(NAME) (NAME##_time)

// communication-heavy
//int N = 1<<28;
//int K = 1<<2;

// computation-heavy
int N = 1<<20;
int K = 1<<10;
