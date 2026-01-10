#!/usr/bin/env bash
set -euo pipefail

# compile demo runner
./compileBallDemo.sh

# Define the output file
OUTPUT_FILE="/scratch/chrono/demo_outputs/outputBallsDemo2.txt"

# Clear the output file if it exists
: > "$OUTPUT_FILE"

cd /scratch/chrono/demo_executables

echo "Change num balls. [500, 1000, 2000, 4000] (5 runs each)" >> "$OUTPUT_FILE"
echo "Threads: 2 Duration: 2.0" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

for balls in 500 1000 2000 4000; do
  echo "=== ${balls} Balls ===" >> "$OUTPUT_FILE"
  for run in {1..5}; do
    echo "Run ${run}/5:" >> "$OUTPUT_FILE"
    srun ./ballDemo 2 "$balls" 2.0 >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
  done
  echo "" >> "$OUTPUT_FILE"
done

echo "Change num threads. [1, 2, 4, 8, 16, 32, 64] (5 runs each)" >> "$OUTPUT_FILE"
echo "Balls: 1000 Duration: 2.0" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

for threads in 1 2 4 8 16 32 64; do
  echo "=== ${threads} Threads ===" >> "$OUTPUT_FILE"
  for run in {1..5}; do
    echo "Run ${run}/5:" >> "$OUTPUT_FILE"
    srun ./ballDemo "$threads" 1000 2.0 >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
  done
  echo "" >> "$OUTPUT_FILE"
done

echo "Change duration. [0.5, 1.0, 2.0, 4.0, 8.0] (5 runs each)" >> "$OUTPUT_FILE"
echo "Balls: 1000 Threads: 2" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

for duration in 0.5 1.0 2.0 4.0 8.0; do
  echo "=== Duration: ${duration} ===" >> "$OUTPUT_FILE"
  for run in {1..5}; do
    echo "Run ${run}/5:" >> "$OUTPUT_FILE"
    srun ./ballDemo 2 1000 "$duration" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
  done
  echo "" >> "$OUTPUT_FILE"
done
