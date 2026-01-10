%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: May 1, 2025
% 
% PROGRAM: betterint.m
% PURPOSE: Function to implement a combination of the midpoint and 
%          trapezoidal rule Riemann Sums for the integral from a to b of 
%          f(x)dx with n intervals.
%
% VARIABLES: 
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = betterint(f, a, b, n)
    h = (b - a) / n;
    mid = mid2(f, a, b, n);
    trap = trap2(f, a, b, n);
    out = (mid + trap - ((h^2) / 24)) / 2;
end