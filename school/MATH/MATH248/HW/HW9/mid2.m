%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: May 1, 2025
% 
% PROGRAM: mid2.m
% PURPOSE: Function to implement the midpoint rule Riemann Sum for the 
%          integral from a to b of f(x)dx with n intervals.
%
% VARIABLES: 
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = mid2(f, a, b, n)
    out = 0;
    h = (b - a) / n;
    for i = 1:n
        out = out + f(a + (i - 0.5) * h);
    end
    out = out * h;
end