/*
 * hellos.c
 *
 * CS 470 Activity
 * 
 * Original unsynchronized version
 * 
 * Final target sequence:
 *   1) All peer threads say hello (in any order)
 *   2) Main thread says hello
 *   3) All peer threads say goodbye, in order and each 1 sec apart
 *   4) Main thread says goodbye
 * 
 * Goal: minimal overall synchronization
 *
 * Compile with --std=c99
 */

#include <pthread.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#define MAX_THREADS 10000000

int nthreads;

pthread_mutex_t say_hello = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t hellos_done = PTHREAD_COND_INITIALIZER;
volatile int num_hellos_said = 0;

pthread_mutex_t say_goodbye = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t start_goodbyes = PTHREAD_COND_INITIALIZER;
volatile bool time_for_goodbyes = false;

/*
 * peer thread work function
 */
void* thread_work(void* tid)
{
    // say hello
    printf("Hello from thread #%ld!\n", (long)tid);

    pthread_mutex_lock(&say_hello);
    num_hellos_said++;
    if (num_hellos_said == nthreads) {
        pthread_cond_signal(&hellos_done);
    }
    pthread_mutex_unlock(&say_hello);

    // say goodbye
    pthread_mutex_lock(&say_goodbye);
    while (!time_for_goodbyes) {
        pthread_cond_wait(&start_goodbyes, &say_goodbye);
    }
    pthread_mutex_unlock(&say_goodbye);
    printf("Goodbye from thread #%ld!\n", (long)tid);

    return NULL;
}

int main(int argc, char* argv[])
{
    // check and parse command line options
    if (argc != 2) {
        printf("Usage: %s <nthreads>\n", argv[0]);
        exit(EXIT_FAILURE);
    }
    nthreads = strtol(argv[1], NULL, 10);
    pthread_t* threads = (pthread_t*)malloc(sizeof(pthread_t) * nthreads);

    // spawn worker threads
    for (int t = 0; t < nthreads; t++) {
        pthread_create(&threads[t], NULL, thread_work, (void*)(long)t);
    }

    pthread_mutex_lock(&say_hello);
    while (num_hellos_said < nthreads) {
        pthread_cond_wait(&hellos_done, &say_hello);
    }
    pthread_mutex_unlock(&say_hello);

    printf("Hello from the main thread!\n");

    pthread_mutex_lock(&say_goodbye);
    time_for_goodbyes = true;
    pthread_cond_broadcast(&start_goodbyes);
    pthread_mutex_unlock(&say_goodbye);

    // join worker threads
    for (int t = 0; t < nthreads; t++) {
        pthread_join(threads[t], NULL);
    }

    printf("Goodbye from the main thread!\n");

    free(threads);
    return(EXIT_SUCCESS);
}
