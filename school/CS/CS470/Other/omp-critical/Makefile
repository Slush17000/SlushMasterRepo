TARGETS=critical
CFLAGS=-g -O3 --std=c99 -Wall -pedantic

all: $(TARGETS)

critical: critical.c
	gcc $(CFLAGS) -O3 -fopenmp -o $@ $<

clean:
	rm -f $(TARGETS)
