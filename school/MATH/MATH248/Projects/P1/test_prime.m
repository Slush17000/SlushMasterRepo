%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Michael Berry & Josh Derrow
% JMU-EID: derrowjb
% DATE: March 30, 2025
% 
% PROGRAM: test_prime.m
% PURPOSE: Return number of primes from 2-10000.
%
% VARIABLES: 
%    count = number of primes
%    
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

count = 0;
for i = 2:100000
    if prime(i)
        count = count + 1;
    end
end
fprintf('Number of primes from 2-100000: %d\n', count);