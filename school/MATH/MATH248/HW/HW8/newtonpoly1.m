%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 17, 2025
% 
% PROGRAM: newtonpoly1.m
% PURPOSE: Approximates the function f(x) = sin(x) via Newton polynomials.
%
% VARIABLES: 
%    ns = list of interpolation points
%    i = index of current interpolation point (n value)
%    n = current interpolation point (n value)
%    x = vector of equally spaced points where f(x) is sampled
%    y = the function of interest (f(x) = sin(x))
%    coeff = Newton coefficients of the polynomial
%    z = vector of equally spaced points where f(x) is evaluated
%    true_y = vector containing the true values of sin(x)
%    interp_y = vector containing the interpolated values of the Newton
%               polynomial
%    error = vector that contains the absolute differences between the true
%            and interpolated values
%    max_error = maximum difference between the true and interpolated 
%                values
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Maximum error for n = 6: 1.31e-03
% Maximum error for n = 8: 2.44e-05
% Maximum error for n = 10: 3.01e-07

function newtonpoly1
    ns = [6, 8, 10];
    for i = 1:length(ns)
        n = ns(i);
        x = linspace(0, pi, n);
        y = sin(x);
        coeff = newtoncoeff(x, y);

        % Evaluation points
        z = linspace(0, pi, 1000);
        true_y = sin(z);
        interp_y = arrayfun(@(zval) newtoneval(coeff, x, zval), z);
        error = abs(true_y - interp_y);
        max_error = max(error);

        % Plot the function and interpolation
        figure;
        subplot(1, 2, 1);
        plot(z, true_y, 'b-', 'LineWidth', 2); hold on;
        plot(z, interp_y, 'r--', 'LineWidth', 2);
        plot(x, y, 'ko', 'MarkerFaceColor', 'k');
        title(['Newton Interpolation (n = ', num2str(n), ')']);
        legend('sin(x)', 'Interpolation', 'Nodes', 'Location', 'best');
        xlabel('x'); 
        ylabel('y');

        % Plot the absolute error
        subplot(1, 2, 2);
        plot(z, error, 'm', 'LineWidth', 2);
        title('Absolute Error');
        xlabel('x'); 
        ylabel('|sin(x) - P(x)|');

        % Display maximum error
        fprintf('Maximum error for n = %d: %.2e\n', n, max_error);
    end
end