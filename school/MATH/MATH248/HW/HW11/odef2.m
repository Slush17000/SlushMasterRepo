%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: May 13, 2025
% 
% PROGRAM: odef2.m
% PURPOSE: Function to represent an first-order ordinary differential 
%          equation.
%
% VARIABLES: 
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = odef2(t, y)
    out = (2 / t) * y + (t^2) * exp(t);
end