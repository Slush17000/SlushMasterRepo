#include "def.h"

void add(int n, int k, float *x, float *y)
{
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < k; j++) {
            y[i] += x[i];
        }
    }
}

int main(void)
{
    float *x, *y;
    x = (float*)malloc(N*sizeof(float));
    y = (float*)malloc(N*sizeof(float));

    // initialize x and y arrays on the host
    for (int i = 0; i < N; i++) {
        x[i] = 1.0f;
        y[i] = 0.0f;
    }

    // run add routine
    START_TIMER(add)
    add(N, K, x, y);
    STOP_TIMER(add)

    // check for errors (all values should be 3.0f)
    float maxError = 0.0f;
    for (int i = 0; i < N; i++) {
        maxError = fmax(maxError, fabs(y[i]-(float)K));
    }
    printf("Time: %f  Max error: %f\n", GET_TIMER(add), maxError);

    // free memory
    free(x);
    free(y);

    return 0;
}
