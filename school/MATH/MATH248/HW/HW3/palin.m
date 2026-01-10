%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: March 10, 2025
% 
% PROGRAM: palin.m
% PURPOSE: Function to determine if a positive integer is palindromic.
%
% VARIABLES: 
%    n = input value
%    result = boolean return value
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function result = palin(n)
    result = palindromic(digits(n));
end