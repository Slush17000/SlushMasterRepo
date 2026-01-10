%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 27, 2025
% 
% PROGRAM: big.m
% PURPOSE: From a user-inputted list of numbers, output the size of that 
% list and the largest number in that list.
%
% VARIABLES: 
%    count = size of the list
%    max = largest value in the list
%    n = input value
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

count = 0;
max = 0;
n = input('Enter a number, 0 to stop: ');
while n > 0
    count = count + 1;
    if (n >= max)
        max = n;
    end
    n = input('Enter a number, 0 to stop: ');
end
fprintf('Size of the list: %d\n', count);
fprintf('Largest number in the list: %d\n', max);