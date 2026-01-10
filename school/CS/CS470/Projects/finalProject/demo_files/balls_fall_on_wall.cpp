
#include <chrono>
#include <iostream>

#include "chrono_multicore/physics/ChSystemMulticore.h"
#include "/scratch/chrono/chrono/src/chrono/physics/ChBodyEasy.h"
#include "chrono/core/ChRealtimeStep.h"
#include "chrono/core/ChVector3.h"

using namespace chrono;

int main(int argc, char* argv[]) {
    // Default parameters
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

    // Set time step
    double time_step = 1e-3;

    // Contact and solver settings
    system.GetSettings()->solver.tolerance = 1e-3;
    system.GetSettings()->collision.narrowphase_algorithm = ChNarrowphase::Algorithm::HYBRID;

    // Create ground
    auto mat = chrono_types::make_shared<ChContactMaterialNSC>();
    auto ground = chrono_types::make_shared<ChBodyEasyBox>(10, 1, 10, 1000, true, true, mat);
    ground->SetPos(ChVector3<>(0, 0.5, 0));
    ground->SetFixed(true);
    system.Add(ground);

    // --- vertical wall parameters ---
    double wall_thickness  = 1.0; // thickness of the wall
    double wall_height = 10.0;    // extends from y = 0 up to y = 10
    double wall_width  = 10.0;    // same as ground in z
    double restitution = 0.8;     // hard wall

    auto wall_mat = chrono_types::make_shared<ChContactMaterialNSC>();
    auto wall = chrono_types::make_shared<ChBodyEasyBox>(wall_width, wall_height, wall_thickness,
        1000,                   // density
        true,                   // visualization
        true,                   // collision
        wall_mat                // material
    );

    // Position the wall so its base just sits on the ground:
    //   ground top is at y = +0.5
    //   so wall’s center should be at y = 0.5 + wall_height/2
    wall->SetPos(ChVector3<>(0, 0.5 + wall_height/2, 0));

    wall->SetFixed(true);
    wall->EnableCollision(true);
    system.Add(wall);

    // Create spheres above wall
    auto sphereMat = chrono_types::make_shared<ChContactMaterialNSC>();
    sphereMat->SetFriction(0.4f);
    double radius = 0.15;
    double mass = 1;
    ChVector3d inertia = (2.0 / 5.0) * mass * radius * radius * ChVector3d(1, 1, 1);
    for (int i = 0; i < num_spheres; ++i) {
        auto sphere = chrono_types::make_shared<ChBodyEasySphere>(radius, 1000, true, true, sphereMat);
        sphere->SetPos(ChVector3<>(0, radius + i * 2 * radius, 0));
        sphere->SetMass(mass);
        sphere->SetInertiaXX(inertia);
        sphere->SetFixed(false);
        sphere->EnableCollision(true);
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
    std::cout << "Elapsed Time: " << elapsed.count() << " sec" << std::endl;

    return 0;
}



