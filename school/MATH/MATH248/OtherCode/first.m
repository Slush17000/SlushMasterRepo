%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: January 23, 2025
% 
% PROGRAM: first.m
% PURPOSE: Quadratic Formula
% CREDIT: Adapted from an example written by Stephen Lucas
%
% VARIABLES: 
%    a, b, c = coefficients of quadratic
%    r = output of quadratic formula
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

a = input('Enter a: ');
b = input('Enter b: ');
c = input('Enter c: ');
r = (-b + sqrt(b^2 - 4 * a * c)) / (2 * a);
fprintf('The value of r is %d\n', r)
% Other ways to display: r, disp(r)