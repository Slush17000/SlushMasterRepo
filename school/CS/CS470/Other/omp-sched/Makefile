CFLAGS=-g -Wall --std=c99 -pedantic -fopenmp
TARGETS=sched sched_work

all: $(TARGETS)

sched: sched.c
	gcc $(CFLAGS) -fopenmp -o $@ $<
sched_work: sched_work.c
	gcc $(CFLAGS) -fopenmp -o $@ $< -lm

clean:
	rm -f $(TARGETS)

