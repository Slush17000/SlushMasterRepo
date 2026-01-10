%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: January 30, 2025
% 
% PROGRAM: fifthpowersum.m
% PURPOSE: Summation of the numbers 1-n all raised to the fifth power
%
% VARIABLES: 
%    n  = input value
%    sum = return value
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

n = input('Enter n: ');
sum = 0;
for i = 1:n
    sum = sum + i^5;
end
fprintf('Fifth Power Sum: %d\n', sum);