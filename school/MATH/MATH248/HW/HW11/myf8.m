%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: May 13, 2025
% 
% PROGRAM: myf8.m
% PURPOSE: Function to return an arbitrary function's value.
%
% VARIABLES: 
%    out = return value & the representation of the function
%    t = input value & the independent variable in the function
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = myf8(t)
    out = (t.^2) .* (exp(t) - exp(1));
end