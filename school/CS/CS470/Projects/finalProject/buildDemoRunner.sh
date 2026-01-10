#compile demo runner

srun --gres=gpu g++ benchmark_threads.cpp -o benchmark_threads \
  -I/nfs/home/benne2ml/470FinalProject/chrono/src \
  -I/nfs/home/benne2ml/470FinalProject/chrono/build \
  -I/shared/common/eigen-3.4.0/ \
  -I/nfs/home/benne2ml/470FinalProject/blaze/ \
  -I/nfs/home/benne2ml/470FinalProject/chrono/src/chrono/collision/bullet \
  -L/nfs/home/benne2ml/470FinalProject/chrono/build/lib \
  -Wl,-rpath=/nfs/home/benne2ml/470FinalProject/chrono/build/lib \
  -lChrono_multicore -lChrono_core -pthread \

export LD_LIBRARY_PATH=/nfs/home/benne2ml/470FinalProject/chrono/build/lib:$LD_LIBRARY_PATH
