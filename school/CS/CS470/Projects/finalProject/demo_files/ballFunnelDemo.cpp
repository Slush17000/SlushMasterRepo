
#include <chrono>
#include <iostream>
#include <filesystem>
#include <fstream>

#include "chrono_multicore/physics/ChSystemMulticore.h"
#include "chrono/src/chrono/physics/ChBodyEasy.h"
#include "chrono/core/ChRealtimeStep.h"
#include "chrono/core/ChVector3.h"
#include "chrono/core/ChQuaternion.h"
#include "chrono/core/ChRotation.h"

using namespace chrono;

// Write positions of all bodies to a VTK file for ParaView
void WriteVTK(chrono::ChSystem& system, const std::string& filename) {
    std::ofstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Could not open " << filename << " for writing.\n";
        return;
    }

    const auto& bodies = system.GetBodies();

    file << "# vtk DataFile Version 3.0\n";
    file << "Chrono output\n";
    file << "ASCII\n";
    file << "DATASET POLYDATA\n";
    file << "POINTS " << bodies.size() << " float\n";

    // Write body positions
    for (const auto& body : bodies) {
        auto pos = body->GetPos();
        file << pos.x() << " " << pos.y() << " " << pos.z() << "\n";
    }

    // Optionally, draw a sphere at each point
    file << "\nVERTICES " << bodies.size() << " " << bodies.size() * 2 << "\n";
    for (int i = 0; i < bodies.size(); ++i) {
        file << "1 " << i << "\n";
    }

    file.close();
}


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

    // Create a contact material
    auto mat = chrono_types::make_shared<ChContactMaterialNSC>();
    
    // Create ground
    auto ground = chrono_types::make_shared<ChBodyEasyBox>(10, 1, 10, 1000, true, true, mat);
    ground->SetFixed(true);
    system.Add(ground);

    // Funnel walls (4 inclined planes)
    double wall_thickness = 0.2;
    double wall_height = 5.0;
    double wall_angle_deg = 45.0;
    double wall_angle_rad = wall_angle_deg * CH_DEG_TO_RAD;
    double slope_offset = 2.0;

    auto make_wall = [&](const ChVector3<>& pos, const ChVector3<>& rot) {
        auto wall = chrono_types::make_shared<ChBodyEasyBox>(6.0, wall_thickness, 6.0, 1000, true, true, mat);
        wall->SetFixed(true);

        chrono::AngleSet angles;
        angles.angles = rot;
        angles.seq = chrono::RotRepresentation::CARDAN_ANGLES_XYZ;  // this is equivalent to Euler123
        wall->SetRot(QuatFromAngleSet(angles));

        wall->SetPos(pos);
        system.Add(wall);
    };

    // 4 walls angled in XZ directions
    make_wall(ChVector3<>(0, wall_height / 2, slope_offset), ChVector3<>(wall_angle_rad, 0, 0));
    make_wall(ChVector3<>(0, wall_height / 2, -slope_offset), ChVector3<>(-wall_angle_rad, 0, 0));
    make_wall(ChVector3<>(slope_offset, wall_height / 2, 0), ChVector3<>(0, 0, wall_angle_rad));
    make_wall(ChVector3<>(-slope_offset, wall_height / 2, 0), ChVector3<>(0, 0, -wall_angle_rad));
    
    // Spheres dropped above the funnel
    double radius = 0.5;
    for (int i = 0; i < num_spheres; ++i) {
        auto sphere = chrono_types::make_shared<ChBodyEasySphere>(radius, 1000, true, true, mat);
        double x = ((rand() % 100) / 100.0 - 0.5) * 1.0;  // small random x
        double z = ((rand() % 100) / 100.0 - 0.5) * 1.0;  // small random z
        sphere->SetPos(ChVector3<>(x, 6.0 + i * 0.2, z));
        system.Add(sphere);
    }

    // Start timing
    auto start = std::chrono::high_resolution_clock::now();

    // Simulation loop
    double time = 0.0;
    int frame = 0;
    while (time < sim_duration) {
        // Output visual vtk every 10 steps
        if (frame % 10 == 0) {
            std::string filename = "ballDemoVTK_output/frame_" + std::to_string(frame) + ".vtk";
            WriteVTK(system, filename);
        }

        system.DoStepDynamics(time_step);
        time += time_step;
        frame++;
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