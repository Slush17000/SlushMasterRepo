%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 4, 2025
% 
% PROGRAM: myavg.m
% PURPOSE: Computes the average of the user input using a for loop
%
% VARIABLES: 
%    n, x = input values
%    s = cumulative sum
%    av = average
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

n = input('How many: ');
if n <= 0
    disp('Invalid input');
else
    s = 0;
    for i = 1:n
        x = input('Enter number: ');
        s = s + x;
    end
    av = s / n;
    fprintf('Average: %0.5f\n', av);
end