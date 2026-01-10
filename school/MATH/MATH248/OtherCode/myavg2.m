%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 4, 2025
% 
% PROGRAM: myavg2.m
% PURPOSE: Computes the average of the user input using a while loop
%
% VARIABLES: 
%    n = count
%    s = cumulative sum
%    x = input value
%    av = average
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

n = 0;
s = 0;
x = input('Enter a number, 0 to end: ');
while x > 0
    n = n + 1;
    s = s + x;
    x = input('Enter a number, 0 to end: ');
end
if n == 0
    disp('No numbers');
else
    av = s / n;
    fprintf('Average: %0.5f\n', av);
end
