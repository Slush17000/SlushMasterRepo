%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 10, 2025
% 
% PROGRAM: secant2.m
% PURPOSE: Function to solve f(x) = 0 using the secant method starting at 
%          x0, x1.
%
% VARIABLES: 
%    out = return value and the value of x such that f(x) = 0
%    f = input function to be evaluated
%    x0 = first input x value
%    x1 = second input x value
%    fx0 = function value at x0
%    fx1 = function value at x1
%    err = error estimate
%    k = number of function evaluations
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = secant2(f, x0, x1)
    % Evaluate function
    fx0 = f(x0);
    fx1 = f(x1);
    err = abs(x0 - x1);
    k = 1;

    while (err > 1e-10) && (k < 30)
        x2 = x1 - fx1 * (x1 - x0) / (fx1 - fx0); % Secant formula
        err = abs(x2 - x1);
        x0 = x1;
        x1 = x2;
        if (err > 1e-10) && (k < 30)
            fx0 = fx1;
            fx1 = f(x1);
            k = k + 1;
        end
        % disp(k);
        % disp(x2);
    end

    if (k >= 30)
        error('Did not converge');
    else
        disp(k);
        disp(x2);
        out = x2;
    end
end