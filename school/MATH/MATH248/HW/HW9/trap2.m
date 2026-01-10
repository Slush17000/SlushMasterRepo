%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: May 1, 2025
% 
% PROGRAM: trap2.m
% PURPOSE: Function to implement the trapezoidal rule Riemann Sum for the 
%          integral from a to b of f(x)dx with n intervals.
%
% VARIABLES: 
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = trap2(f, a, b, n)
    h = (b - a) / n;
    out = (f(a) + f(b)) / 2;
    for i = 1:n - 1
        out = out + f(a + (i * h));
    end
    out = out * h;
end