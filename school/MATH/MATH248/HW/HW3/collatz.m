%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: March 10, 2025
% 
% PROGRAM: collatz.m
% PURPOSE: Function to output the size of a given hailstone sequence 
%
% VARIABLES: 
%    x = input value and the current value of the sequence
%    count = size of the list
%    c = return value
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function c = collatz(x)
    count = 0;
    while x > 1
        count = count + 1;
        if (mod(x, 2) == 0) % Even
            x = x / 2;
        else % Odd
            x = 3 * x + 1;
        end
    end
    count = count + 1; % To accomodate the end value (1)
    c = count;
end