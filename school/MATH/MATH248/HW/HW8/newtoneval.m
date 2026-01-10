%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 17, 2025
% 
% PROGRAM: newtoneval.m
% PURPOSE: Helper method to evaluate the Newton polynomial at the point z.
%
% VARIABLES: 
%    val = return value representing the Newton polynomial at the point z
%    coeff = return value representing Newton coefficients
%    x = vector of equally spaced points where f(x) is sampled
%    z = point at which the Newton polynomial is evaluated
%    n = number of Newton coefficients
%    k = index of the current Newton interpolation value
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function val = newtoneval(coeff, x, z)
    n = length(coeff);
    val = coeff(n);
    for k = n - 1:-1:1
        val = val * (z - x(k)) + coeff(k);
    end
end