%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 4, 2025
% 
% PROGRAM: testsum.m
% PURPOSE: Which number from 1 to 911 has the biggest sum of digits?
%
% VARIABLES: 
%    big = biggest sum
%    bigi = original number with the biggest sum
%    x = sum of the digits of the current number
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

big = 0;
bigi = 0;
for i = 1:911
    x = sumdigits(i);
    if x > big
        big = x;
        bigi = i;
    end
end
fprintf('The number with the biggest sum of digits is %d with sum = %d\n', bigi, big);