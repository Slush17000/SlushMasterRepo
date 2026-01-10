#!/bin/bash

make qsort

for t in 1 2 4 8 16; do
    OMP_NUM_THREADS=$t ./qsort
done

