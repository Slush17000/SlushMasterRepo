TARGETS=mpi_sendrecv mpi_bcast mpi_gather mpi_numa
CFLAGS=-g -O0 --std=c99 -Wall -pedantic

all: $(TARGETS)

mpi_sendrecv: mpi_sendrecv.c
	mpicc $(CFLAGS) -o $@ $<

mpi_bcast: mpi_bcast.c
	mpicc $(CFLAGS) -o $@ $<

mpi_gather: mpi_gather.c
	mpicc $(CFLAGS) -o $@ $<

mpi_numa: mpi_numa.c
	mpicc $(CFLAGS) -o $@ $<

clean:
	rm -f $(TARGETS)
