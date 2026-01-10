#compile demo runner
./compileBallDemo.sh

# Define the output file
OUTPUT_FILE="weakoutputBallsDemo.txt"

# Clear the output file if it exists
> $OUTPUT_FILE


echo "" >> $OUTPUT_FILE
echo "Change num threads and balls. [1, 2, 4, 8, 16, 32, 64]" >> $OUTPUT_FILE
echo "Balls: 1000 Duration 2.0" >> $OUTPUT_FILE
echo "1 Thread" >> $OUTPUT_FILE
srun ./ballDemo 1 1000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "2 Threads" >> $OUTPUT_FILE
srun ./ballDemo 2 2000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "4 Threads" >> $OUTPUT_FILE
srun ./ballDemo 4 4000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "8 Threads" >> $OUTPUT_FILE
srun ./ballDemo 8 8000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "16 Threads" >> $OUTPUT_FILE
srun ./ballDemo 16 16000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
echo "32 Threads" >> $OUTPUT_FILE
srun ./ballDemo 32 32000 2.0 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE
