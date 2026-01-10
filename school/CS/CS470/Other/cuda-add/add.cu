#include "def.h"

__global__
void add(int n, int k, float *x, float *y)
{
    int index = blockIdx.x * blockDim.x + threadIdx.x;
    int stride = blockDim.x * gridDim.x;
    for (int i = index; i < n; i += stride) {
        for (int j = 0; j < k; j++) {
            y[i] += x[i];
        }
    }
}

int main(int argc, char* argv[])
{
    // parse command-line parameters
    if (argc != 3) {
        printf("Usage: %s <nblocks> <nthreads>\n", argv[0]);
        return EXIT_FAILURE;
    }
    int nblocks  = strtol(argv[1], NULL, 10);
    int nthreads = strtol(argv[2], NULL, 10);

    // unified memory – accessible from CPU or GPU
    float *x, *y;
    cudaMallocManaged(&x, N*sizeof(float));
    cudaMallocManaged(&y, N*sizeof(float));

    // initialize x and y arrays on the host
    for (int i = 0; i < N; i++) {
        x[i] = 1.0f;
        y[i] = 0.0f;
    }

    // run kernel on the GPU
    START_TIMER(add)
    add<<<nblocks, nthreads/nblocks>>>(N, K, x, y);

    // wait for GPU to finish
    cudaDeviceSynchronize();

    STOP_TIMER(add)

    // check for errors (all values should be 3.0f)
    float maxError = 0.0f;
    for (int i = 0; i < N; i++) {
        maxError = fmax(maxError, fabs(y[i]-(float)K));
    }
    printf("Time: %f  Max error: %f\n", GET_TIMER(add), maxError);

    // free memory
    cudaFree(x);
    cudaFree(y);

    return 0;
}

