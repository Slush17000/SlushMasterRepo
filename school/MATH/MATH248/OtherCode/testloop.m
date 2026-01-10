%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: January 28, 2025
% 
% PROGRAM: testloop.m
% PURPOSE: Outputs the sum from 1 to n
%
% VARIABLES: 
%    n  = input value
%    s  = sum
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

n = input('Enter n: ');
s = 0;
for i = 1:n
    s = s + i;
end
fprintf('Sum from 1 to %d = %d\n', n, s);