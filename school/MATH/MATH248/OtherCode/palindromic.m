%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 5, 2025
% 
% PROGRAM: palindromic.m
% PURPOSE: Determine if a sequence of numbers is palindromic or not.
%
% VARIABLES: 
%    n = length of the sequence
%    i = left index of the sequence
%    j = right index of the sequence
%    s = boolean output - true/false
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% One line version:
% s = sum(fliplr(a) == a) == length(a)

function s = palindromic(a)
n = length(a);
i = 1;
j = n;
while i < j && a(i) == a(j)
    i = i + 1;
    j = j - 1;
end
if i >= j
    s = true;
else
    s = false;
end
