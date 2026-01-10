%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 7, 2025
% 
% PROGRAM: testdiff.m
% PURPOSE: Outputs the exact and approximate derivates of sqrt(x) at the given x-value
%
% VARIABLES: 
%    x = input value
%    h = margin of error
%    f = relevant function: sqrt(x)
%    f_prime = derivative of f: 1 / (2 * sqrt(x))
%    approx_derivative = the approximate derivative of sqrt(x) at x
%    error = absolute value of the difference between the exact and approximate derivatives
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% First order forward difference approximation:
% The output errors mostly agree with the theory that reducing h by a
% factor of ten also reduces the error by a factor of ten. However, when 
% h ≤ 10^(-7) the output error becomes unpredictable.
% Second order forward difference approximation:
% The output errors somewhat agree with the theory that reducing h by a
% factor of ten also reduces the error by a factor of ten. However this
% time, the output error becomes unpredictable sooner (h ≤ 10^(-6)).

x = input('Enter an x-value: ');
h = 0;
f = sqrt(x);
f_prime = 1 / (2 * sqrt(x));
fprintf('f(x) = sqrt(x)\n');
fprintf('f\''(x) = 1/(2sqrt(x))\n');
fprintf('Exact derivative: f\''(%d) = %.10f\n', x, f_prime);
fprintf('First order difference approximations of sqrt(x) when x = %d: \n', x)
for i = 1:8
    h = 10^(-i);
    approx_derivative = (1 / h) * (sqrt(x + h) - sqrt(x));
    error = abs(f_prime - approx_derivative);
    fprintf('\th = %.8f: f\''(%d) ≈ %.10f, error = %.10f\n', h, x, approx_derivative, error);
end
fprintf('Second order difference approximations of sqrt(x) when x = %d: \n', x)
for i = 1:8
    h = 10^(-i);
    approx_derivative = (1 / (2 * h)) * (sqrt(x + h) - sqrt(x - h));
    error = abs(f_prime - approx_derivative);
    fprintf('\th = %.8f: f\''(%d) ≈ %.10f, error = %.10f\n', h, x, approx_derivative, error);
end