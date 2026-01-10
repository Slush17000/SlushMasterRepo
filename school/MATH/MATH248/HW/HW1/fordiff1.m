%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: January 24, 2025
% 
% PROGRAM: fordiff1.m
% PURPOSE: Output sqrt(x) and approximate the derivative of sqrt(x)
%
% VARIABLES: 
%    x, h  = input values
%    sqrt_x = the square root of x
%    approx_derivative = the approximate derivative of sqrt(x) at x
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

x = input('Enter an x-value: ');
h = input('Enter a small h-value: ');
sqrt_x = sqrt(x);
approx_derivative = (1 / h) * (sqrt(x + h) - sqrt(x));
fprintf('The square root of %d is: %d\n', x, sqrt_x)
fprintf('The instantaneous rate of change of sqrt(x) at x = %d is: %.5f\n', x, approx_derivative)