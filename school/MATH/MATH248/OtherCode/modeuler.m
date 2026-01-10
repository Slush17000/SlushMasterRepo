%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 29, 2025
% 
% PROGRAM: modeuler.m
% PURPOSE: Function to solve y' = f(t, y) on (a <= t <= b) via the Modified 
%          Euler's method with n intervals, output vectors of t and w_i ~ 
%          y(t_i).
%
% VARIABLES: 
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function [t, w] = modeuler(f, a, b, n, alpha)
    h = (b - a) / n;
    w = zeros(n + 1, 1);
    w(1) = alpha;
    t = linspace(a, b, n + 1);
    for i = 1:n
        w(i + 1) = w(i) + h * f(t(i) + h / 2, w(i) + h / 2 * f(t(i), w(i)));
    end
end