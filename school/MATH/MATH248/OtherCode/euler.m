%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 29, 2025
% 
% PROGRAM: euler.m
% PURPOSE: Function to solve y' = f(t, y) on (a <= t <= b) via Euler's 
%          method with n intervals, output vectors of t and w_i ~ y(t_i).
%
% VARIABLES: 
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function [t, w] = euler(f, a, b, n, alpha)
    h = (b - a) / n;
    w = zeros(n + 1, 1);
    w(1) = alpha;
    t = linspace(a, b, n + 1);
    for i = 1:n
        w(i + 1) = w(i) + h * f(t(i), w(i));
    end
end