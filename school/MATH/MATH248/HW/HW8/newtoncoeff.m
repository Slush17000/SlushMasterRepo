%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 17, 2025
% 
% PROGRAM: newtoncoeff.m
% PURPOSE: Helper method to interpolate Newton coefficients.
%
% VARIABLES: 
%    coeff = return value representing Newton coefficients
%    x = vector of equally spaced points where f(x) is sampled
%    y = the function of interest: f(x)
%    n = number interpolation points
%    j = index of the current coefficient evaluation
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function coeff = newtoncoeff(x, y)
    n = length(x);
    coeff = y;
    for j = 2:n
        coeff(j:n) = (coeff(j:n) - coeff(j - 1:n - 1)) ./ (x(j:n) - x(1:n - j + 1));
    end
end