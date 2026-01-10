#!/bin/bash

# Set the name of the output executable
OUTPUT="par_sum"

# Compile the program
echo "Compiling the program..."
gcc --std=c99 par_sum.c -pthread -o $OUTPUT

# Define the test files
test_files=("test1.txt" "test2.txt" "test3.txt" "test4.txt")

# Define the thread counts
thread_counts=(4 8 16 24)
alternate_counts=(2 3 4)

echo "Running test on p1_example.txt with 1 thread:"
srun ./$OUTPUT "p1_example.txt" 1
echo "----------------------------------------"
for threads in "${alternate_counts[@]}"; do
    echo "Running test on p1_example.txt with $threads threads:"
    srun ./$OUTPUT "p1_example.txt" $threads
    echo "----------------------------------------"
done

# Run tests
for file in "${test_files[@]}"; do
    for threads in "${thread_counts[@]}"; do
        echo "Running test on $file with $threads threads:"
        srun ./$OUTPUT $file $threads
        echo "----------------------------------------"
    done
done

echo "Tests completed."
