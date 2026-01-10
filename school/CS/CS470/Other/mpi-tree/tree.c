/*
 * tree.c
 *
 * CS 470 Activity
 * Tree-based distributed communication pattern example
 *
 * This example should exchange messages in a binary tree pattern as show below
 * and discussed in Section 3.4.5 of the textbook. The program should print
 * "send" and "recv" messages as indicated below and the final assembled "hop"
 * counts.
 *
 * Hints:
 *
 *   - Do you need to send to multiple nodes at every node? Do you ever need to
 *     receive from multiple nodes?
 *
 *   - Under what conditions do you send to (my_rank+1)? What about (my_rank+2)?
 *     What about (my_rank+4)? Can you generalize this pattern?
 *
 *   - Given the generalized pattern from above, can you determine who you
 *     should receive from?
 *
 *   - What exactly do you need to send and receive in each communication to
 *     make sure the hop counts are accurate at the end?
 *
 *   - It may be useful at first to implement sending at each node before
 *     receiving (perhaps using MPI_Isend). Once the correct communication
 *     pattern is working, then figure out how to re-order it so that the
 *     receiving happens before the sending at each node.
 *
 * Compile with --std=c99
 *
 * Pattern (see also Figure 3.10):
 *
 *   0
 *   |
 *   |-------4
 *   |       |
 *   |---2   |---6
 *   |   |   |   |
 *   |-1 |-3 |-5 |-7
 *   | | | | | | | |
 *   0 1 2 3 4 5 6 7
 *
 * Expected output for nprocs=4 (output may be reordered):
 *
 *   rank 0 send to 1
 *   rank 0 send to 2
 *   rank 1 recv from 0
 *   rank 2 recv from 0
 *   rank 2 send to 3
 *   rank 3 recv from 2
 *   HOPS: [ 0 1 1 2 ]
 *
 * Expected output for nprocs=8 (output may be reordered):
 *
 *   rank 0 send to 1
 *   rank 0 send to 2
 *   rank 0 send to 4
 *   rank 1 recv from 0
 *   rank 2 recv from 0
 *   rank 2 send to 3
 *   rank 3 recv from 2
 *   rank 4 recv from 0
 *   rank 4 send to 5
 *   rank 4 send to 6
 *   rank 5 recv from 4
 *   rank 6 recv from 4
 *   rank 6 send to 7
 *   rank 7 recv from 6
 *   HOPS: [ 0 1 1 2 1 2 2 3 ]
 *
 * Expected output for nprocs=16 (send/recv output omitted):
 *
 *   HOPS: [ 0 1 1 2 1 2 2 3 1 2 2 3 2 3 3 4 ]
 */

#include <stdio.h>
#include <stdlib.h>
#include <mpi.h>

int main(int argc, char *argv[])
{
    MPI_Init(&argc, &argv);

    // determine number of processes and current rank
    int my_rank;
    int nprocs;
    MPI_Comm_rank(MPI_COMM_WORLD, &my_rank);
    MPI_Comm_size(MPI_COMM_WORLD, &nprocs);

    // initial hop count
    int hops = 0;

    // TODO: receive

    // TODO: send

    // gather and print all hops at rank 0
    int tmp[nprocs];
    MPI_Gather(&hops, 1, MPI_INT, tmp, 1, MPI_INT, 0, MPI_COMM_WORLD);
    if (my_rank == 0) {
        printf("HOPS: [ ");
        for (int i = 0; i < nprocs; i++) {
            printf("%d ", tmp[i]);
        }
        printf("]\n");
    }

    MPI_Finalize();
    return EXIT_SUCCESS;
}

