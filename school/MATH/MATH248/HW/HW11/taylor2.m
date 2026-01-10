%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: May 13, 2025
% 
% PROGRAM: taylor2.m
% PURPOSE: Function to solve y' = f(t, y) on (a <= t <= b) via Taylor's 
%          method with n intervals, output vectors of t and w_i ~ y(t_i).
%
% VARIABLES: 
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function [t, w2, w4, w2error, w4error] = taylor2(f, y_exact, a, b, n, alpha)
    h = (b - a) / n;
    t = linspace(a, b, n + 1)';
    w2 = zeros(n + 1, 1);
    w4 = zeros(n + 1, 1);
    w2(1) = alpha;
    w4(1) = alpha;

    delta = 1e-5;  % finite difference step size

    % Partial derivative approximators
    dfdt = @(t0, y0) (f(t0 + delta, y0) - f(t0 - delta, y0)) / (2 * delta);
    dfdx = @(t0, y0) (f(t0, y0 + delta) - f(t0, y0 - delta)) / (2 * delta);

    for i = 1:n
        ti = t(i);
        % === 2nd-order Taylor ===
        w2i = w2(i);
        f1 = f(ti, w2i);
        f2_val = dfdt(ti, w2i) + dfdx(ti, w2i) * f1;
        w2(i+1) = w2i + h*f1 + (h^2/2)*f2_val;

        % === 4th-order Taylor ===
        w4i = w4(i);
        f1 = f(ti, w4i);
        dfdx_val = dfdx(ti, w4i);
        dfdt_val = dfdt(ti, w4i);

        % 2nd derivative
        f2_val = dfdt_val + dfdx_val * f1;

        % 3rd derivative
        f2_p = dfdt(ti + delta, w4i) + dfdx(ti + delta, w4i) * f(ti + delta, w4i);
        f2_m = dfdt(ti - delta, w4i) + dfdx(ti - delta, w4i) * f(ti - delta, w4i);
        f3_val = (f2_p - f2_m) / (2 * delta);

        % 4th derivative
        f3_p = ( ...
            dfdt(ti + 2*delta, w4i) + dfdx(ti + 2*delta, w4i) * f(ti + 2*delta, w4i) - ...
            dfdt(ti, w4i) - dfdx(ti, w4i) * f(ti, w4i) ...
        ) / (2 * delta);

        f3_m = ( ...
            dfdt(ti, w4i) + dfdx(ti, w4i) * f(ti, w4i) - ...
            dfdt(ti - 2*delta, w4i) - dfdx(ti - 2*delta, w4i) * f(ti - 2*delta, w4i) ...
        ) / (2 * delta);

        f4_val = (f3_p - f3_m) / (2 * delta);

        w4(i+1) = w4i + h*f1 + (h^2/2)*f2_val + (h^3/6)*f3_val + (h^4/24)*f4_val;
    end

    % Final errors
    w2error = abs(w2(end) - y_exact(b));
    w4error = abs(w4(end) - y_exact(b));
end