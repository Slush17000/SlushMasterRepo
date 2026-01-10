#!/bin/bash

# TODO: change these numbers if necessary for your benchmark!
for n in 1 8 16 32 64 128; do
    echo "== $n processes =="
    grep -E "Time in seconds|Mop/s" ep-$n.txt
    echo
done

