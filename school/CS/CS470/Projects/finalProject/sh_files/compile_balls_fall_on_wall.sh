#compile balls_fall_on_wall demo

srun --gres=gpu g++ /scratch/chrono/demo_files/balls_fall_on_wall.cpp -o /scratch/chrono/demo_executables/balls_fall_on_wall \
  -I/scratch/chrono/chrono/src \
  -I/scratch/chrono/chrono/build \
  -I/shared/common/eigen-3.4.0/ \
  -I/scratch/chrono/blaze-3.8/ \
  -I/scratch/chrono/chrono/src/chrono/collision/bullet \
  -L/scratch/chrono/chrono/build/lib \
  -Wl,-rpath=/scratch/chrono/chrono/build/lib \
  -lChrono_multicore -lChrono_core -pthread \
  -O3
