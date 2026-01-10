#include <stdio.h>
#include <stdlib.h>

__global__
void hello()
{
    printf("Hello from thread %d in block %d\n", threadIdx.x, blockIdx.x);
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

    // launch kernel on GPU
    hello<<<nblocks, nthreads/nblocks>>>();

    // wait for GPU to finish
    cudaDeviceSynchronize();

    return EXIT_SUCCESS;
}

