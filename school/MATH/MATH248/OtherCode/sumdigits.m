%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 4, 2025
% 
% PROGRAM: sumdigits.m
% PURPOSE: sum the digits of the input n
%
% VARIABLES: 
%    s = sum
%    d = digit count
%    n = input value
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function [s, d] = sumdigits(n)
% Function to sum the digits of n, output as s.

s = 0;
d = 0;
while n > 0
    d = d + 1;
    s = s + mod(n, 10);
    n = floor(n / 10);
end