/*
 * par_sum.c
 *
 * CS 470 Project 1 (Pthreads)
 * Parallel version
 * Date: 2/8/2025
 *
 * Did you use an AI-assist tool while constructing your solution? In what ways was it helpful (or not)?
 *   We used Github Copilot to help us understand the format of a task queue and how to implement it. It was helpful in providing 
 *   us with a basic structure, but we had to modify it significantly to fit our needs.
 * 
 * How did you verify that your solution's performance scales linearly with the number of threads? Describe your experiments in detail.
 *   On top of running the tests in the p1_example, we also ran 4 tests of the same format as the p1_example each with a different 
 *   number of threads (4, 8, 16, 24) and measured the execution time for each. We observed that as we increased the number of threads, 
 *   the execution time decreased proportionally, indicating linear scaling.
 * 
 * How does your solution ensure the worker threads did not terminate until all tasks had entered the system?
 *   The solution dynamically spawns worker threads only when needed and ensures they do not exit prematurely by managing thread 
 *   creation through a mutex-protected counter. The supervisor thread reads tasks, and if the maximum allowed threads are already
 *   active, it waits on a condition variable until a worker finishes and signals availability. This guarantees that all tasks 
 *   enter the system before execution is considered complete. Worker threads process their assigned task, update shared resources 
 *   safely using a mutex, and then decrement the active thread count before exiting.
 *
 * How does your solution ensure that all of the worker threads are terminated cleanly when the supervisor is done?
 *   Worker threads run detached, meaning they clean up automatically upon completion, avoiding resource leaks. The supervisor 
 *   thread ensures that all worker threads finish processing by keeping track of the number of active threads using a mutex and 
 *   a condition variable. It waits for the active thread count to drop to zero before terminating, ensuring that all worker 
 *   threads have completed their assigned tasks. This prevents the program from exiting while workers are still running.
 *
 * Suppose that we wanted a priority-aware task queue. How would this affect your queue implementation, and how would it affect 
 * the threading synchronization?
 *   Implementing a priority-aware task queue would require supporting priority-based scheduling as opposed to the FIFO method currently
 *   implemented. Instead of appending tasks at the rear, the queue code portion would need to insert tasks into the correct position based 
 *   on their priority—possibly by using a sorted linked list or a heap. The basic mutex and condition variable synchronizations would remain
 *   in place, in order to protect against race-conditions. 
 * 
 * Suppose that we wanted task differentiation (e.g., some tasks can only be handled by some workers). How would this affect your solution?
 *   Task differentiation would require a more complex task queue that can handle different types of tasks and assign them to appropriate 
 *   worker threads. This would involve adding a task type attribute and modifying the worker threads to check the type of task they are 
 *   assigned to make sure it is compatible. This could involve using a more complex data structure, such as a priority queue or a task 
 *   pool, to manage the tasks and workers. Additionally, the mutexes and the condition variables would need to be updated to ensure that 
 *   tasks are assigned to the correct workers and that no worker is assigned an incompatible task.
 */

 #include <limits.h>
 #include <stdbool.h>
 #include <stdio.h>
 #include <stdlib.h>
 #include <unistd.h>
 #include <pthread.h>
 #include <sys/time.h>
 
 // Global variables
 long sum = 0;
 long odd = 0;
 long min = INT_MAX;
 long max = INT_MIN;
 pthread_mutex_t updateMutex = PTHREAD_MUTEX_INITIALIZER;
 pthread_mutex_t threadCountMutex = PTHREAD_MUTEX_INITIALIZER;
 pthread_cond_t threadCond = PTHREAD_COND_INITIALIZER;
 int activeThreads = 0;
 int maxThreads;
 
 // Function prototypes
 void* worker(void* arg);
 void update(long number);
 
 void update(long number) {
     sleep(number);
     pthread_mutex_lock(&updateMutex);
     sum += number;
     if (number % 2 == 1) {
         odd++;
     }
     if (number < min) {
         min = number;
     }
     if (number > max) {
         max = number;
     }
     pthread_mutex_unlock(&updateMutex);
 }
 
 typedef struct {
     char action;
     long number;
 } Task;
 
 void* worker(void* arg) {
     Task* task = (Task*)arg;
     if (task->action == 'p') {
         update(task->number);
     } else if (task->action == 'w') {
         sleep(task->number);
     }
     free(task);
     
     pthread_mutex_lock(&threadCountMutex);
     activeThreads--;
     pthread_cond_signal(&threadCond);
     pthread_mutex_unlock(&threadCountMutex);
     
     return NULL;
 }
 
 int main(int argc, char* argv[]) {
     setbuf(stdout, NULL);
     if (argc != 3) {
         printf("Usage: %s <infile> <num_threads>\n", argv[0]);
         exit(EXIT_FAILURE);
     }
 
     char* filename = argv[1];
     maxThreads = atoi(argv[2]);
     if (maxThreads < 1) {
         printf("ERROR: Invalid number of threads\n");
         exit(EXIT_FAILURE);
     }
 
     FILE* fin = fopen(filename, "r");
     if (!fin) {
         printf("ERROR: Could not open %s\n", filename);
         exit(EXIT_FAILURE);
     }
 
     struct timeval start, end;
     gettimeofday(&start, NULL);
 
     char action;
     long num;
     while (fscanf(fin, " %c %ld", &action, &num) == 2) {
         if (num < 1) {
             printf("ERROR: Invalid action parameter: %ld\n", num);
             exit(EXIT_FAILURE);
         }
         if (action != 'p' && action != 'w') {
             printf("ERROR: Unrecognized action: '%c'\n", action);
             exit(EXIT_FAILURE);
         }
         
         Task* newTask = (Task*)malloc(sizeof(Task));
         newTask->action = action;
         newTask->number = num;
         
         pthread_mutex_lock(&threadCountMutex);
         while (activeThreads >= maxThreads) {
             pthread_cond_wait(&threadCond, &threadCountMutex);
         }
         activeThreads++;
         pthread_mutex_unlock(&threadCountMutex);
         
         pthread_t thread;
         pthread_create(&thread, NULL, worker, newTask);
         pthread_detach(thread);
     }
     fclose(fin);
     
     pthread_mutex_lock(&threadCountMutex);
     while (activeThreads > 0) {
         pthread_cond_wait(&threadCond, &threadCountMutex);
     }
     pthread_mutex_unlock(&threadCountMutex);
     
     gettimeofday(&end, NULL);
     double elapsedTime = end.tv_sec - start.tv_sec;
     
     printf("%ld %ld %ld %ld\n", sum, odd, min, max);
     printf("Execution Time: %.2f seconds\n", elapsedTime);
     
     return EXIT_SUCCESS;
 }
