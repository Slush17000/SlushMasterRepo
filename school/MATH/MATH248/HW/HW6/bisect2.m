%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 10, 2025
% 
% PROGRAM: bisect2.m
% PURPOSE: Function to solve f(x) = 0 in [a, b] by bisection.
%
% VARIABLES: 
%    out = first return value & the root estimation
%    i = second return value & the number of bisection iterations
%    f = first input value representing an arbitrary function
%    a = second input value representing the lower bound of an root-finding 
%        interval
%    b = third input value representing the upper bound of an root-finding 
%        interval
%    fa = function value at x = a
%    fb = function value at x = b
%    i = number of iterations of the bisection method
%    e = error estimate
%    tol = solution precision
%    m = midpoint of the root-finding interval
%    
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function [out, i] = bisect2(f, a, b)
    fa = f(a);
    fb = f(b);
    if ((fa < 0 && fb < 0) || (fa > 0 && fb > 0))
        error('Invalid Interval');
    end
    i = 0;
    e = (b - a) / 2;
    tol = 1e-10;
    while (e > tol)
        m = (a + b) / 2;
        i = i + 1;
        if (f(a) * f(m) > 0)
            a = m; % Throw away first half
        else
            b = m; % Throw away second half
        end
        e = e / 2;
    end
    out = (a + b) / 2; % Middle of the smallest interval is the estimate
end