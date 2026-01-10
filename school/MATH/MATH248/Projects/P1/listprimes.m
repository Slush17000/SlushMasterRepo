%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Michael Berry & Josh Derrow
% JMU-EID: derrowjb
% DATE: March 30, 2025
% 
% PROGRAM: listprimes.m
% PURPOSE: Return an array from 1 to n where the i'th number in the array 
%          is 0 if composite and 1 if prime.
%
% VARIABLES: 
%    ret = return array
%    n = size of the array input value
%    
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function ret = listprimes(n)
    % Initialize array of all ones except for first index
    ret = ones(1, n);
    ret(1) = 0;

    % Outer loop from 2 to sqrt(n)
    for i = 2:floor(sqrt(n))
        if ret(i) == 1 % Checks for prime numbers
            for j = i * i:i:n % Unchecks all multiples of prime numbers
                ret(j) = 0;
            end
        end
    end
end