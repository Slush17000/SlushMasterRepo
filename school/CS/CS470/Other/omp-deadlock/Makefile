CFLAGS=-g -Wall --std=c99 -pedantic

deadlock: deadlock.c
	gcc $(CFLAGS) -fopenmp -o $@ $<

clean:
	rm -f deadlock

