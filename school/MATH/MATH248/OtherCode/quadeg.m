%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Stephen Lucas
% JMU-EID: lucassk
% DATE: August 19, 2019
% 
% PROGRAM: quadeg.m
% PURPOSE:  Compute the roots of a quadratic function
% CREDIT: Adapted from an example written by Carla Martin
%
% VARIABLES: 
%    a,b,c = coefficients of quadratic
%    discriminant = square root of the discriminant, b^2-4*a*c
%    root_1, root_2 = the two roots of the equation
%    real_part1, real_part2 = real parts of each root
%    complex_part1, complex_part2 = complex parts of each root
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% If you were to declare variables you would do it here first. It's 
% required in Java, not in Matlab.

% Ask user for input of the coefficients of the quadratic function
a=input('Please enter the second order coefficient \n');
b=input('Please enter the first order coefficient \n');
c=input('Please enter the zero order coefficient \n');

% Compute the roots using the quadratic formula

discriminant = sqrt(b^2-4.0*a*c); two_a = 2.0*a;
root_1=(-b+discriminant)/two_a;  % compute root 1
root_2=(-b-discriminant)/two_a;  % compute root 2

% Separate complex and real parts (only used for the output)
real_part1=real(root_1);  % separate real/imag parts for printing (root_1)
complex_part1=abs(imag(root_1));
real_part2=real(root_2);  % separate real/imag parts for printing (root_2)
complex_part2=abs(imag(root_2));

% Outputs roots to the screen
fprintf(' root 1: %5.2f + %5.2f i \n', real_part1,complex_part1);
fprintf(' root 2: %5.2f - %5.2f i \n', real_part2,complex_part2);
