%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: May 10, 2025
% 
% PROGRAM: romberg.m
% PURPOSE: Evaluates an integral via the Romberg Method.
%
% VARIABLES: 
%    f = function to evacuate
%    a = lower limit of the interval
%    b = upper limit of the interval
%    m = number of subintervals
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function romberg_value = romberg(f, a, b, m)
    h = b - a;
    r = zeros (2, m + 1);
    r (1, 1) = (f(a) + f(b)) / 2 * h;
    for i = 2:m
        romberg_value = 0;
        for k = 1:(2^(i - 2))
            romberg_value = romberg_value + f(a + (k - 0.5) * h);
        end
        r(2, 1) = (r(1, 1) + h * romberg_value) / 2;
  
        for j = 2:i
            l = 2^(2 * (j - 1));
            r(2, j) = r(2, j - 1) + (r(2, j - 1) - r(1, j - 1)) / (l - 1);
        end
        h = h / 2;
        for j = 1:i
            r(1, j) = r(2, j);
        end
    end
    romberg_value = r(2, m);
end