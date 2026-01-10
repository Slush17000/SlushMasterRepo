#!/bin/bash
#
#SBATCH --job-name=ep
#SBATCH --output=ep.txt
#SBATCH --time=1:00:00

for i in 1 2 4 8 16 32 64; do
    echo "== $i thread(s) =="
    OMP_NUM_THREADS="$i" ./ep.A.x | grep -E "Time in seconds|Mop/s"
    echo ""
done

