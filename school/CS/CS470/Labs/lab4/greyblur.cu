/**
 * CS 470 CUDA Lab
 *
 * Name(s): Brennan Krutis & Josh Derrow
 *
 * Originally written by William Lovo in Spring 2019 as a research project.
 * 
 * Analysis:
 * Data: https://docs.google.com/spreadsheets/d/1rmYpguTTovUy5Wm4fo0GjS7E-l9yhg-59sEPqKgVGAw/edit?usp=sharing
 * 
 * Which block size works best? Provide a rationale for your choice.
 *      The best block size was 10, as it has the highest speedup for both subroutines.
 * 
 * How much of an improvement is the CUDA implementation compared to the original?
 *      For the Greyscaling, the CUDA implementation speedup was not that great for duke_dog.jpg (S < 1), but was 
 *      closer to the expected 1.5x speedup for the larger-sized duke_dog2.jpg (S > 1). For the Blurring, the CUDA 
 *      implementation was way faster than the serial version for both images (S > 36). 
 * 
 * The answer to the previous question should be different between the greyscale and blurring operations. Why do you 
 * suppose this is? (Hint: read the code!)
 *      The greyscale kernel does a small amount of work per pixel, which means there is more of a bottleneck for the 
 *      memory accesses. The blurring kernel does more arithmetic per pixel, which means the bottleneck is less on the
 *      memory accesses and more on the computation. This is why the blurring kernel has a much higher speedup than the
 *      greyscale kernel.
 * 
 * What are your estimates of the serial % of the greyscale and blurring operations (calculated separately)?
 *     The serial % for the greyscale operation is around 69.441% and the serial % for the blurring operation is 1.591%.
 * 
 * What does all of this imply about the value of a GPU as part of a hybrid parallel/distributed system (i.e., under what 
 * circumstances would a GPU be desirable)?
 *      A GPU is most valuable in a hybrid system when the computational workload is highly parallel and compute-intensive.
 *      The overhead (or serial fraction) is low enough to allow the GPU to efficiently hide memory latencies and other fixed 
 *      costs. The problem size is large, so that the GPU’s massive parallelism can be fully exploited. By ensuring that the 
 *      heavy, parallelizable parts of the application are executed on the GPU, while the CPU handles the more sequential tasks, 
 *      a hybrid parallel/distributed system can achieve a significant boost in overall performance.
 */

 #include <stdio.h>
 #include <math.h>
 #include "netpbm.h"
 #include "timer.h"
 
 // The size of the blur box
 #define BLUR_SIZE 6
 #define THREADS_PER_BLOCK 256
 
 /**
  * Converts a given PPM pixel array into greyscale.
  * Uses the following formula for the conversion:
  *      V = (R * 0.21) + (G * 0.72) + (B * 0.07)
  * Where V is the grey value and RGB are the red, green, and blue values, respectively.
  */
 __global__ void color_to_grey(pixel_t *in, pixel_t *out, int total_pixels)
 {
     int i = blockIdx.x * blockDim.x + threadIdx.x;
 
     // Grid-stride loop
     int stride = gridDim.x * blockDim.x;
     for (; i < total_pixels; i += stride) {
         rgb_t v = (rgb_t) round(
               in[i].red * 0.21
             + in[i].green * 0.72
             + in[i].blue * 0.07);
         out[i].red = out[i].green = out[i].blue = v;
     }
 }
 
 /**
  * Blurs a given PPM pixel array through box blurring.
  * Strength of blur can be adjusted through the BLUR_SIZE value.
  */
 __global__ void blur_kernel(pixel_t *in, pixel_t *out, int width, int height)
{
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    int stride = gridDim.x * blockDim.x;

    for (; i < width * height; i += stride) {
        int row = i / width;
        int col = i % width;
        float avg_red = 0, avg_green = 0, avg_blue = 0;
        int pixel_count = 0;

        for (int blur_row = -BLUR_SIZE; blur_row <= BLUR_SIZE; blur_row++) {
            for (int blur_col = -BLUR_SIZE; blur_col <= BLUR_SIZE; blur_col++) {
                int curr_row = row + blur_row;
                int curr_col = col + blur_col;

                if (curr_row >= 0 && curr_row < height && curr_col >= 0 && curr_col < width) {
                    int curr_index = curr_row * width + curr_col;
                    avg_red += in[curr_index].red;
                    avg_green += in[curr_index].green;
                    avg_blue += in[curr_index].blue;
                    pixel_count++;
                }
            }
        }

        out[i].red   = (rgb_t) lroundf(avg_red   / pixel_count);
        out[i].green = (rgb_t) lroundf(avg_green / pixel_count);
        out[i].blue  = (rgb_t) lroundf(avg_blue  / pixel_count);
    }
}
 
 int main(int argc, char *argv[])
 {
     if (argc != 5) {
         printf("Usage: %s <infile> <outfile> <width> <height>\n", argv[0]);
         exit(EXIT_FAILURE);
     }
 
     char *in = argv[1];
     char *out = argv[2];
     int width = strtol(argv[3], NULL, 10),
         height = strtol(argv[4], NULL, 10);
     long total_pixels = width * height;
 
     // Allocate unified memory (accessible by CPU & GPU)
     ppm_t *input, *output;
     cudaMallocManaged(&input, sizeof(ppm_t) + total_pixels * sizeof(pixel_t));
     cudaMallocManaged(&output, sizeof(ppm_t) + total_pixels * sizeof(pixel_t));
 
     // Read image
     START_TIMER(read)
     read_in_ppm(in, input);
     STOP_TIMER(read)
 
     // Verify dimensions
     if(width != input->width || height != input->height) {
         printf("ERROR: given dimensions do not match file\n");
         exit(EXIT_FAILURE);
     }
 
     // Copy header to output image
     copy_header_ppm(input, output);
     // Convert to greyscale
     START_TIMER(grey)
     color_to_grey<<<50, 1000>>>(input->pixels, output->pixels, total_pixels);
     cudaDeviceSynchronize();  // Ensure kernel has finished
     STOP_TIMER(grey)
 
     // Swap buffers in preparation for blurring
     memcpy(input->pixels, output->pixels, total_pixels * sizeof(pixel_t));
 
     // Apply blur filter
    START_TIMER(blur)
    blur_kernel<<<50, 1000>>>(input->pixels, output->pixels, width, height);
    cudaDeviceSynchronize();
    STOP_TIMER(blur)
 
     // Save output image
     START_TIMER(save)
     write_out_ppm(out, output);
     STOP_TIMER(save)
 
     // Display timing results
     printf("READ: %.6f  GREY: %.6f  BLUR: %.6f  SAVE: %.6f\n",
            GET_TIMER(read), GET_TIMER(grey), GET_TIMER(blur), GET_TIMER(save));
 
     cudaFree(input);
     cudaFree(output);
 
     return 0;
 }