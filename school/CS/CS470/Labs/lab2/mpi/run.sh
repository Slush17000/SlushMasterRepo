#!/bin/bash
#
#SBATCH --job-name=ep-MPI_NUM_TASKS
#SBATCH --output=ep-MPI_NUM_TASKS.txt
#SBATCH --ntasks=MPI_NUM_TASKS
#SBATCH --time=1:00:00

# do this before launching the job if you use zsh
module load mpi

srun -n MPI_NUM_TASKS ep.C.MPI_NUM_TASKS

