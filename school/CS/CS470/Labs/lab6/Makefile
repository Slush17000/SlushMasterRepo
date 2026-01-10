all: analysis mpi_analysis

analysis: analysis.c
	gcc -g -O2 --std=c99 -Wall -o analysis analysis.c

mpi_analysis: mpi_analysis.c
	mpicc -g -O2 --std=c99 -Wall -o mpi_analysis mpi_analysis.c

clean:
	rm -f analysis mpi_analysis

