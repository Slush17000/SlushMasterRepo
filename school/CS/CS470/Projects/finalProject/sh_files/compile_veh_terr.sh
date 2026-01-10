#compile vehicle_over_terrain demo

srun --gres=gpu g++ /scratch/chrono/demo_files/vehicle_over_terr_demo.cpp -o /scratch/chrono/demo_executables/vehicle_terr \
  -I/scratch/chrono/chrono/src \
  -I/scratch/chrono/chrono/src/chrono_thirdparty/HACD \
  -I/scratch/chrono/chrono/build \
  -I/shared/common/eigen-3.4.0/ \
  -I/scratch/chrono/blaze-3.8/ \
  -I/scratch/chrono/chrono/src/chrono/collision/bullet \
  -L/scratch/chrono/chrono/build/lib \
  -Wl,-rpath=/scratch/chrono/chrono/build/lib \
  -lChrono_multicore -lChrono_core -pthread -lChronoModels_vehicle -lChrono_vehicle #\
  #-O3
