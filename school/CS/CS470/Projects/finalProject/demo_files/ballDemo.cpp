#include <chrono>
#include <iostream>

#include "chrono_multicore/physics/ChSystemMulticore.h"
#include "/scratch/chrono/chrono/src/chrono/physics/ChBodyEasy.h"
#include "chrono/core/ChRealtimeStep.h"
#include "chrono/core/ChVector3.h"

using namespace chrono;

int main(int argc, char* argv[]) {
    int num_threads = 4;
    int num_spheres = 100;
    double sim_duration = 2.0;

    if (argc > 1) num_threads = std::stoi(argv[1]);
    if (argc > 2) num_spheres = std::stoi(argv[2]);
    if (argc > 3) sim_duration = std::stod(argv[3]);

    // Create a Multicore system with NSC contact
    ChSystemMulticoreNSC system;

    // Set number of threads
    system.SetNumThreads(num_threads);

    // Set gravity
    system.SetGravitationalAcceleration(ChVector3<>(0, -9.81, 0));
    double time_step = 1e-3;

    // Create ground
    auto mat = chrono_types::make_shared<ChContactMaterialNSC>();
    auto ground = chrono_types::make_shared<ChBodyEasyBox>(10, 1, 10, 1000, true, true, mat);
    ground->SetFixed(true);
    system.Add(ground);

    // Create spheres
    double radius = 0.1;
    for (int i = 0; i < num_spheres; ++i) {
        auto sphere = chrono_types::make_shared<ChBodyEasySphere>(radius, 1000, true, true, mat);
        sphere->SetPos(ChVector3<>(0, radius + i * 2 * radius, 0));
        system.Add(sphere);
    }

    // Start timing
    auto start = std::chrono::high_resolution_clock::now();

    // Simulation loop
    double time = 0.0;
    while (time < sim_duration) {
        system.DoStepDynamics(time_step);
        time += time_step;
    }

    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> elapsed = end - start;

    // Report
    std::cout << "Threads: " << num_threads
              << ", Spheres: " << num_spheres
              << ", Duration: " << sim_duration
              << ", Elapsed Time: " << elapsed.count() << " sec" << std::endl;

    return 0;
}
