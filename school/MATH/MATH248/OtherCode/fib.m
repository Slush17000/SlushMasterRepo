%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 5, 2025
% 
% PROGRAM: fib.m
% PURPOSE: Outputs the Fibonacci Sequence up to n
%
% VARIABLES: 
%    n  = input value
%    f0 = initial value of the sequence
%    f1 = second value of the sequence
%    f2 = third value of the sequence
%    g = array of Fibonacci numbers
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

n = input('Enter n: ');
f0 = 0;
f1 = 1;
disp(f0);
disp(f1);
for i = 2:n
    f2 = f0 + f1;
    disp(f2);
    f0 = f1;
    f1 = f2;
end

g = zeros(1, n + 1);
g(1) = 0;
g(2) = 1;
for i = 3:n + 1
    g(i) = g(i - 1) + g(i - 2);
end
disp(g);