%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 10, 2025
% 
% PROGRAM: myf2.m
% PURPOSE: Function to return an arbitrary function's value.
%
% VARIABLES: 
%    out = return value & the representation of the function
%    x = input value & the independent variable in the function
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = myf2(x)
    out = (273000 * x.^4) - (277490 * x.^3) - (228731 * x.^2) + (256181 * x.^1) - 31234;
end