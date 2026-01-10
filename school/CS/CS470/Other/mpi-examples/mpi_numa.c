/*
 * CS 470 MPI Point-to-point Non-Uniform Memory Access (NUMA) Example
 */

#include <stdio.h>
#include <mpi.h>

#define DATA_COUNT 10000000

int signal = 0;
int data[DATA_COUNT];

int main(int argc, char *argv[])
{
    for (long i = 0; i < DATA_COUNT; i++) {
        data[i] = i;
    }

    int my_rank, nranks;

    MPI_Init(NULL, NULL);
    MPI_Comm_rank(MPI_COMM_WORLD, &my_rank);
    MPI_Comm_size(MPI_COMM_WORLD, &nranks);

    if (my_rank == 0) {

        // rank 0: receive from every other process w/ timing
        for (int other = 1; other < nranks; other++) {

            double start = MPI_Wtime();
            MPI_Ssend(&signal, 1, MPI_INT, other, 0, MPI_COMM_WORLD);
            MPI_Recv(&data, DATA_COUNT, MPI_INT, other, MPI_ANY_TAG,
                    MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            printf("Rank %03d: %8.4f s\n", other, (MPI_Wtime() - start));
        }

    } else {

        // other processes: wait for signal, then send our data to rank 0
        MPI_Recv(&signal, 1, MPI_INT, 0, MPI_ANY_TAG, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
        MPI_Ssend(&data, DATA_COUNT, MPI_INT, 0, 0, MPI_COMM_WORLD);

    }

    MPI_Finalize();
    return 0;
}
