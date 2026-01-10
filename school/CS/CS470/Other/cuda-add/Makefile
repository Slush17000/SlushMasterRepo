targets: add add_cuda

run: add add_cuda
	./add
	./add_cuda 5 640
	./add_cuda 1 1024

add: add.c def.h
	gcc -g -O2 -o add add.c -lm

add_cuda: add.cu def.h
	nvcc -g -O2 -o add_cuda add.cu

clean:
	rm -f add add_cuda
