/**
 * dht.c
 *
 * CS 470 Project 3
 *
 * Implementation for distributed hash table (DHT).
 *
 * Names: Brennan Krutis & Josh Derrow
 * 
 * Analysis:
 * Did you use an AI-assist tool while constructing your solution? In what ways was it helpful (or not)?
 *      We used GitHub Copilot to help us fill out the MPI function parameters. It was helpful for writing 
 *      some of the dht methods but this could have also been achieved via wrapper functions. We also found that
 *      it was helpful for writing printf statements to debug our code, saving time from writing the same prints.
 * 
 * Describe your RPC protocol. How are the various different kinds of messages distinguished by the recipient? 
 * How did you ensure that each thread receives the appropriate messages? Is your protocol primarily synchronous 
 * or asynchronous?
 *      Our RPC protocol is a simple message passing protocol with a server thread that is always running and 
 *      probing every millisecond for new messages until all of the processes have been destroyed. Each message has a 
 *      type (RPC_PUT, RPC_GET, RPC_SIZE, RPC_DESTROY) and each message is dealt with according to its type. We 
 *      ensure that each thread receives the appropriate messages with an else-if conditional statement that 
 *      checks the message type. After confirming the message type, the server thread will send that message to 
 *      the recipient, so that the appropriate local work can be done for each message request. Our protocol is 
 *      primarily asynchronous because each message is processesd individually as it is received and the server 
 *      thread can potentially process many messages across multiple processes. However, some methods (such as 
 *      sync and destroy) are synchronous by nature because they require all processes to complete before moving 
 *      on.
 * 
 * How did you verify that your solution is non-deterministic?
 *      We verified that our solution is non-deterministic by running the program multiple times (with debug 
 *      print statements) and observing different orderings of the output, even though the same inputs were 
 *      used every time.
 * 
 * Suppose that we wanted to add a new command called "sort" that performs a distributed merge sort to rank 0 
 * using a fan pattern as shown in Figure 3.6 of our textbook. What difficulties do you anticipate and how would 
 * you address them? Include as much detail as possible.
 *      In order to add a new sort command we would need to implement a new RPC message type (RPC_SORT) and a 
 *      new function (dht_sort) that would handle the distributed merge sort. It could be tricky to implement a 
 *      distributed version, but this could be achieved by using a merge sort algorithm and the MPI_Gather function. 
 *      First, each process would sort its own local data since its already distributed in the hash table (if the 
 *      data wasn't already distributed MPI_Scatter would have to be used), then we would use the MPI_Gather function 
 *      to aggregate the sorted data from each process into rank 0. Once all of the data is gathered, a second merge 
 *      sort could be run locally on rank 0 to verify that the data is sorted correctly.
 * 
 * For this project, performance was not a significant concern because our cluster is not large enough to run with 
 * large process or key counts. However, suppose that we wanted to scale to thousands of processes and millions of 
 * keys. Which of the commands ("put", "get", "sync", and "size") would remain constant in terms of the time 
 * required to complete a single command? Of the rest, would their performance degrade proportional to the number 
 * of processes, the number of keys, or both? What about the "sort" operation from the previous question?
 *      The put and get commands would remain constant in terms of the time required to complete a single command 
 *      regardless of the number of processes or key counts because the time complexity of the put/get commands 
 *      is O(1). This is the case because it only requires a hash function and a local put/get to store/retrieve 
 *      the data. On the other hand the sync and size commands performance would degrade as the number of processes 
 *      increase since the data is distributed across all processes. The time complexity of the distributed sync/size 
 *      commands would be O(n) because the sync command requires a barrier across all processes, and the size command 
 *      must aggregate the local sizes from each process. Therefore, the performance of these two commands are directly 
 *      proportional to the number of processes but are independent of the key count. The time complexity of the 
 *      distributed merge sort operation from the previous question would be O(n * mlog(m)) (where n is the number of 
 *      processes and m is the key count) because the local hash table merge sort algorithm runs in O(mlog(m)) time and 
 *      it must run on all n processes. Therefore, the performance of the sort operation is directly proportional to the 
 *      number of processes and logarithmically proportional to the key count.
 *      
 */

#define _POSIX_C_SOURCE 199309L // for nanosleep 
#include <mpi.h>
#include <pthread.h>
#include <time.h>
#include "dht.h"

struct timespec req = {0, 1000000L}; // 1ms (1,000,000 ns)

typedef enum
{
    RPC_PUT,
    RPC_SIZE,
    RPC_GET,
    RPC_DESTROY
} rpc_type; // remote procedure call types

typedef struct
{
    int type;
    char key[MAX_KEYLEN]; // key string
    long value;           // value to put
    size_t size;          // Used for returning size from nodes
} rpc_message;

/*
 * Private module variable: current process ID (MPI rank)
 */
static int rank;

/* Private module variable: server thread */
static pthread_t server_thread;

/* Private module variable: number of processes */
static int nprocs;

/* Control flag for the server thread loop */
static volatile int server_running = 1;

/*
 * given a key name, return the distributed hash table owner
 * (uses djb2 algorithm: http://www.cse.yorku.ca/~oz/hash.html)
 */
int hash(const char *name)
{
    unsigned hash = 5381;
    while (*name != '\0')
    {
        hash = ((hash << 5) + hash) + (unsigned)(*name++);
    }
    return hash % nprocs;
}

/*
 * Server thread function.
 * This thread continuously checks for incoming
 * RPC messages and processes them.
 */
static void *server(void *arg)
{
    MPI_Status status;
    int flag;
    rpc_message msg;

    while (server_running)
    {
        MPI_Iprobe(MPI_ANY_SOURCE, MPI_ANY_TAG, MPI_COMM_WORLD, &flag, &status);
        if (flag)
        {
            MPI_Recv(&msg, sizeof(rpc_message), MPI_BYTE, status.MPI_SOURCE,
                     MPI_ANY_TAG, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            if (msg.type == RPC_PUT)
            {
               //printf("Rank %d: received PUT for key %s\n", rank, msg.key);
                fflush(stdout);
                local_put(msg.key, msg.value);
            }
            else if (msg.type == RPC_GET)
            {
               //printf("Rank %d: received GET for key %s\n", rank, msg.key);
                long result = local_get(msg.key);
                msg.value = result;
                MPI_Ssend(&msg, sizeof(rpc_message), MPI_BYTE, status.MPI_SOURCE, RPC_GET, MPI_COMM_WORLD);
            }
            else if (msg.type == RPC_SIZE)
            {
               //printf("Rank %d: received SIZE request\n", rank);
                size_t result = local_size();
                msg.size = result;
                MPI_Ssend(&msg, sizeof(rpc_message), MPI_BYTE, status.MPI_SOURCE, RPC_SIZE, MPI_COMM_WORLD);
            }
            else if (msg.type == RPC_DESTROY)
            {
               //printf("Rank %d: received DESTROY request\n", rank);
                server_running = 0;
                MPI_Ssend(&msg, sizeof(rpc_message), MPI_BYTE, status.MPI_SOURCE, RPC_DESTROY, MPI_COMM_WORLD);
            }
        }
        else
        {
            nanosleep(&req, NULL);
        }
    }
    return NULL;
}

int dht_init()
{
    int provided;
    MPI_Init_thread(NULL, NULL, MPI_THREAD_MULTIPLE, &provided);
    if (provided != MPI_THREAD_MULTIPLE)
    {
       //printf("ERROR: Cannot initialize MPI in THREAD_MULTIPLE mode.\n");
        exit(EXIT_FAILURE);
    }
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &nprocs);
    local_init();

    if (pthread_create(&server_thread, NULL, server, NULL) != 0)
    {
        fprintf(stderr, "Error creating server thread\n");
        exit(EXIT_FAILURE);
    }
   //printf("Rank %d: DHT initialized\n", rank);
    return rank;
}

void dht_put(const char *key, long value)
{
    int owner = hash(key);
    if (owner == rank)
    {
       //printf("Rank %d: local PUT for key %s\n", rank, key);
        local_put(key, value);
    }
    else
    {
        rpc_message msg;
        msg.type = RPC_PUT;
        strncpy(msg.key, key, MAX_KEYLEN - 1);
        msg.key[MAX_KEYLEN - 1] = '\0';
        msg.value = value;
       //printf("Rank %d: sending PUT for key %s to rank %d\n", rank, key, owner);
        MPI_Ssend(&msg, sizeof(rpc_message), MPI_BYTE, owner, RPC_PUT, MPI_COMM_WORLD);
    }
}

long dht_get(const char *key)
{
    int owner = hash(key);
    if (owner == rank)
    {
       //printf("Rank %d: local GET for key %s\n", rank, key);
        return local_get(key);
    }
    else
    {
        rpc_message msg;
        msg.type = RPC_GET;
        strncpy(msg.key, key, MAX_KEYLEN - 1);
        msg.key[MAX_KEYLEN - 1] = '\0';
       //printf("Rank %d: sending GET for key %s to rank %d\n", rank, key, owner);
        MPI_Ssend(&msg, sizeof(rpc_message), MPI_BYTE, owner, RPC_GET, MPI_COMM_WORLD);
        MPI_Recv(&msg, sizeof(rpc_message), MPI_BYTE, owner, RPC_GET, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
        return msg.value;
    }
}

size_t dht_size()
{
    size_t total_size = 0;
    rpc_message msg;
    msg.type = RPC_SIZE;

    for (int i = 0; i < nprocs; i++)
    {
        if (i == rank)
        {
            total_size += local_size();
        }
        else
        {
            MPI_Ssend(&msg, sizeof(rpc_message), MPI_BYTE, i, RPC_SIZE, MPI_COMM_WORLD);
            MPI_Recv(&msg, sizeof(rpc_message), MPI_BYTE, i, RPC_SIZE, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            total_size += msg.size;
        }
    }
    return total_size;
}

void dht_sync()
{
    MPI_Barrier(MPI_COMM_WORLD);
   //printf("Rank %d: DHT synchronized\n", rank);
}

void dht_destroy(FILE *output)
{
    MPI_Barrier(MPI_COMM_WORLD);
    rpc_message msg;
    msg.type = RPC_DESTROY;
    MPI_Ssend(&msg, sizeof(rpc_message), MPI_BYTE, rank, RPC_DESTROY, MPI_COMM_WORLD);
    MPI_Recv(&msg, sizeof(rpc_message), MPI_BYTE, rank, RPC_DESTROY, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
   //printf("Rank %d: DHT destroyed\n", rank);
    pthread_join(server_thread, NULL);
    local_destroy(output);

    MPI_Finalize();
}