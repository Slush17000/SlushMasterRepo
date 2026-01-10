#compile demo runner

# Define the output file
OUTPUT_FILE="chrono_demo_balls_falling.txt"

# Clear the output file if it exists
> $OUTPUT_FILE

echo "Change num balls. [500, 1000, 2000, 4000]" >> $OUTPUT_FILE
echo "Threads: 2 Duration 2.0" >> $OUTPUT_FILE
echo "500 Balls" >> $OUTPUT_FILE
srun ./benchmark_threads 2 500 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "1000 Balls" >> $OUTPUT_FILE
srun ./benchmark_threads 2 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "2000 Balls" >> $OUTPUT_FILE
srun ./benchmark_threads 2 2000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "4000 Balls" >> $OUTPUT_FILE
srun ./benchmark_threads 2 4000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "" >> $OUTPUT_FILE
echo "Change num threads. [1, 2, 4, 8, 16, 32, 64]" >> $OUTPUT_FILE
echo "Balls: 1000 Duration 2.0" >> $OUTPUT_FILE
echo "1 Thread" >> $OUTPUT_FILE
srun ./benchmark_threads 1 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "2 Threads" >> $OUTPUT_FILE
srun ./benchmark_threads 2 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "4 Threads" >> $OUTPUT_FILE
srun ./benchmark_threads 4 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "8 Threads" >> $OUTPUT_FILE
srun ./benchmark_threads 8 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "16 Threads" >> $OUTPUT_FILE
srun ./benchmark_threads 16 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "32 Threads" >> $OUTPUT_FILE
srun ./benchmark_threads 32 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "64 Threads" >> $OUTPUT_FILE
srun ./benchmark_threads 64 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "" >> $OUTPUT_FILE
echo "Change duration. [0.5, 1.0, 2.0, 4.0, 8.0]" >> $OUTPUT_FILE
echo "Balls: 1000 Threads: 2" >> $OUTPUT_FILE
echo "0.5 Duration" >> $OUTPUT_FILE
srun ./benchmark_threads 2 1000 0.5 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "1.0 Duration" >> $OUTPUT_FILE
srun ./benchmark_threads 2 1000 1.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "2.0 Duration" >> $OUTPUT_FILE
srun ./benchmark_threads 2 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "4.0 Duration" >> $OUTPUT_FILE
srun ./benchmark_threads 2 1000 4.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "8.0 Duration" >> $OUTPUT_FILE
srun ./benchmark_threads 2 1000 8.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

