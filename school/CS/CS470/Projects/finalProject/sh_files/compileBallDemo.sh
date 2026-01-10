#compile demo runner

cd /scratch/chrono/demo_files

srun --gres=gpu g++ ballDemo.cpp -o /scratch/chrono/demo_executables/ballDemo \
  -I/scratch/chrono/chrono/src \
  -I/scratch/chrono/chrono/build \
  -I/shared/common/eigen-3.4.0/ \
  -I/scratch/chrono/blaze-3.8/ \
  -I/scratch/chrono/chrono/src/chrono/collision/bullet \
  -L/scratch/chrono/chrono/build/lib \
  -Wl,-rpath=/scratch/chrono/chrono/build/lib \
  -lChrono_multicore -lChrono_core -pthread \
  #-O3

cd /scratch/chrono/sh_files