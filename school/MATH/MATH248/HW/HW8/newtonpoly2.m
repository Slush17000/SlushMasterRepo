%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 17, 2025
% 
% PROGRAM: newtonpoly2.m
% PURPOSE: Approximates the function f(x) = 1 / (1 + 25x^2) via Newton 
%          polynomials.
%
% VARIABLES: 
%    ns = list of interpolation points
%    f = the function of interest (f(x) = 1 / (1 + 25x^2))
%    z = interval of evaluation
%    true_y = vector containing the true values of 1 / (1 + 25x^2)
%    i = index of current interpolation point (n value)
%    n = current interpolation point (n value)
%    x = vector of equally spaced points where f(x) is sampled
%    y = function values at the x points
%    coeff = Newton coefficients of the polynomial
%    interp_y = vector containing the interpolated values of the Newton
%               polynomial
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Using more points is both good and bad in this scenario. In the middle of
% the plot, n = 11 was the most accurate, however, towards the endpoints of
% the interval it was the least accurate. The plots of n = 5 and n = 7 
% follow a similar trend but to a smaller degree.

function newtonpoly2
    ns = [5, 7, 11];
    f = @(x) 1 ./ (1 + 25 * x.^2);
    z = linspace(-1, 1, 1000);
    true_y = f(z);

    % Create the figure for plotting and plot the true function
    figure;
    hold on;
    plot(z, true_y, 'b-', 'LineWidth', 2);

    for i = 1:length(ns)
        n = ns(i);
        x = linspace(-1, 1, n);         % Equally spaced nodes
        y = f(x);                      % Function values at the nodes

        % Compute the Newton coefficients and polynomial
        coeff = newtoncoeff(x, y);

        % Interpolate and plot the Newton polynomial
        interp_y = arrayfun(@(zval) newtoneval(coeff, x, zval), z);
        plot(z, interp_y, 'LineWidth', 2);
    end

    % Configure the plot
    title('Newton Interpolation for f(x) = 1 / (1 + 25x^2)');
    legend('True function', 'n = 5', 'n = 7', 'n = 11', 'Location', 'best');
    xlabel('x');
    ylabel('f(x)');
    grid on;
    hold off;
end