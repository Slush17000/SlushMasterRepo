#!/bin/bash

# TODO: change these numbers if necessary for your benchmark!
for n in 1 8 16 32 64 128; do

    # run MPI program as a batch job, customizing options first
    sed -e "s/MPI_NUM_TASKS/$n/g" run.sh | sbatch

done

