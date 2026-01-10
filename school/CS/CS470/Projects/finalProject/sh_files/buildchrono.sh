#!/bin/bash

#THIS WILL ERASE ANY CHRONO FILES AND CREATE A CLEAN BUILD

#echo "Running createchrono.sh script..."
#rm -rf ./chrono

#get chrono repo
#git clone --recursive https://github.com/projectchrono/chrono.git

#retrieve and download blaze for multicore
#wget https://bitbucket.org/blaze-lib/blaze/downloads/blaze-3.8.tar.gz
#tar -xzf blaze-3.8.tar.gz

cd chrono

#Roots to various dependencies 
Eigen_ROOT="/shared/common/eigen-3.4.0/"
THRUST_DIR=/usr/local/cuda/targets/x86_64-linux/include/
BLAZE_DIR=/scratch/chrono/blaze-3.8/

module load mpi
rm -rf build
mkdir build
cd build
srun --gres=gpu cmake .. \
    -DTHRUST_INCLUDE_DIR="$THRUST_DIR" \
    -DEIGEN3_INCLUDE_DIR="$Eigen_ROOT" \
    -Dblaze_INCLUDE_DIR="$BLAZE_DIR" \
    -DCH_ENABLE_MODULE_GPU=ON \
    -DCH_ENABLE_MODULE_VEHICLE=ON \
    -DCH_ENABLE_MODULE_MULTICORE=ON \

srun --gres=gpu make -j
cd ../..
