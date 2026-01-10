#compile the demo
./compile_balls_fall_on_wall.sh

# Define the output file
OUTPUT_FILE="/scratch/chrono/demo_outputs/OPTIMIZED_balls_fall_on_wall_output.txt"

# Clear the output file if it exists
: > "$OUTPUT_FILE"

cd /scratch/chrono/demo_executables

echo "Strong scaling tests" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Change Thread Count. [1, 2, 4, 8, 16, 32] (5 runs each)" >> "$OUTPUT_FILE"
echo "Balls: 1000 Duration: 2.0" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
for threads in 1 2 4 8 16 32; do
  echo "=== ${threads} Threads ===" >> "$OUTPUT_FILE"
  for run in {1..3}; do
    echo "Run ${run}/3:" >> "$OUTPUT_FILE"
    srun ./balls_fall_on_wall "$threads" 1000 2.0 >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
  done
  echo "" >> "$OUTPUT_FILE"
done

echo "Weak scaling tests" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Change Number of Balls. [500, 1000, 2000, 4000] (5 runs each)" >> "$OUTPUT_FILE"
echo "Threads: 2 Duration: 2.0" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
for balls in 500 1000 2000 4000; do
  echo "=== ${balls} Balls ===" >> "$OUTPUT_FILE"
  for run in {1..3}; do
    echo "Run ${run}/3:" >> "$OUTPUT_FILE"
    srun ./balls_fall_on_wall 2 "$balls" 2.0 >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
  done
  echo "" >> "$OUTPUT_FILE"
done