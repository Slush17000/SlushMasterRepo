TARGETS=array array_serial
CFLAGS=-g -O3 --std=c99 -Wall -pedantic

all: $(TARGETS)

array: array.c
	gcc $(CFLAGS) -O3 -fopenmp -o $@ $<

array_serial: array.c
	gcc $(CFLAGS) -O3 -Wno-unknown-pragmas -o $@ $<

clean:
	rm -f $(TARGETS)
