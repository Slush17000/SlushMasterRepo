%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 10, 2025
% 
% PROGRAM: funcplot.m
% PURPOSE: Plots an arbitrary function.
%
% VARIABLES: 
%    x = independent variable (ranges from -2 to +2 with 300 subintervals)
%    y = dependent variable representing an arbitrary function
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

x = linspace(-2, 2, 301);
y = (273000 * x.^4) - (277490 * x.^3) - (228731 * x.^2) + (256181 * x.^1) - 31234;
plot(x, y);
grid on