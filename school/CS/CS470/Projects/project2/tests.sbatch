#!/bin/bash
#SBATCH --job-name=gauss_experiments
#SBATCH --output=experiment_results.log
#SBATCH --error=experiment_errors.log
#SBATCH --gres=gpu:1  # Request 1 GPU per job (modify if needed)
#SBATCH --cpus-per-task=1  # Adjust based on available CPUs
#SBATCH --time=02:00:00  # Adjust max runtime

# Define matrix sizes to test
MATRIX_SIZES=(4000 8000 12000 16000 20000 24000 28000 32000 36000 40000 44000)

echo "Experiment Results" > experiment_results.log
echo "==================" >> experiment_results.log
echo "Starting experiments..."

for size in "${MATRIX_SIZES[@]}"; do
    echo "Running with matrix size: $size" | tee -a experiment_results.log
    
    # Run serial version
    echo "Running par_gauss_serial..." | tee -a experiment_results.log
    srun --gres=gpu:1 ./par_gauss_serial -t $size >> experiment_results.log 2>&1
    
    # Run original sequential version
    echo "Running gauss..." | tee -a experiment_results.log
    srun --gres=gpu:1 ./gauss -t $size >> experiment_results.log 2>&1
    
    # Run parallel version
    echo "Running par_gauss..." | tee -a experiment_results.log
    srun --gres=gpu:1 ./par_gauss -t $size >> experiment_results.log 2>&1
    
    echo "------------------------------------" >> experiment_results.log
done

echo "Experiments completed. Check experiment_results.log for results."