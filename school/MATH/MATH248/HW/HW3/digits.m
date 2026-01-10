%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: March 10, 2025
% 
% PROGRAM: digits.m
% PURPOSE: Function to reverse the digits of n.
%
% VARIABLES: 
%    n = input value
%    numDigits = number of digits in n
%    reversedVector = return vector that contains the digits of n in 
%                     reverse order
%    index = location of the current value in the reversedVector
%    digit = current digit of n
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function reversedVector = digits(n)
    if ((n <= 0) || (floor(n) ~= n))
        error('Input must be a natural number.');
    end
    
    numDigits = floor(log10(n)) + 1;
    reversedVector = zeros(1, numDigits);
    
    index = 1;
    while n > 0
        digit = mod(n, 10);
        reversedVector(index) = digit;
        n = floor(n / 10);
        index = index + 1;
    end
end