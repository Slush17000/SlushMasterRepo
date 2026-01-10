%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: March 10, 2025
% 
% PROGRAM: maxcollatz.m
% PURPOSE: Outputs the largest hailstone sequence starting value and length
% for integers less than or equal to 1000.
%
% VARIABLES: 
%    maxVal = largest hailstone sequence starting value
%    maxValLength = length of the largest hailstone sequence
%    tempVal = current hailstone sequence starting value
%    tempValLength = length of the current hailstone sequence
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% The largest hailstone sequence starting value is 871, with length 179.

maxVal = 0;
maxValLength = 0;

for a = 1:1000
    tempVal = a;
    tempValLength = collatz(a);
    if (tempValLength > maxValLength)
        maxVal = tempVal;
        maxValLength = tempValLength;
    end
end

fprintf('Largest hailstone sequence starting value (1 - 1000): %d\n', maxVal);
fprintf('Largest hailstone sequence length: %d\n', maxValLength);