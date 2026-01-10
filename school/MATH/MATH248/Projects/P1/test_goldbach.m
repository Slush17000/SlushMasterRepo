%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Michael Berry & Josh Derrow
% JMU-EID: derrowjb
% DATE: March 30, 2025
% 
% PROGRAM: test_goldbach.m
% PURPOSE: Return graph of goldbach numbers (4-10000).
%
% VARIABLES: 
%    arr = goldbach array
%    lp = list of primes
%    freq = frequency of each prime number pairing
%    max = max amount of prime pairings
%    maxNum = number with max amount of prime pairings
%    
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Have found that 4 numbers have exactly one pair of distinct prime
% factors, 9 have exactly two pairs of distinct prime numbers, and 11 have
% exactly three pairs of distinct prime numbers.

arr = zeros(1, 10000); % To be filled with goldbach numbers
lp = listprimes(10000);
for i = 4:2:10000
    arr(i) = goldbach(lp, i);
end

count_one = 0;
count_two = 0;
count_three = 0;
for i = 4:2:10000
    if arr(i) == 1
        count_one = count_one + 1;
    elseif arr(i) == 2
        count_two = count_two + 1;
    elseif arr(i) == 3
        count_three = count_three + 1;
    end
end

freq = zeros(1, 10000); % Find frequency of each prime number pairing
for i = 4:2:10000
    freq(arr(i)) = freq(arr(i)) + 1;
end

max = 0;
for i = 1:10000
    if (freq(i) > 0) && (i > max)
        max = i;
    end
end
fprintf('Maximum number of ways to add up to an even number: %d\n', max);
% Found that the maximum number of ways to add up to an even number 
% (between 4-10000) with two primes is 329

maxNum = 0;
for i = 4:2:10000
    if arr(i) == max
        maxNum = i;
    end
end
fprintf('Number with %d unique combos: %d\n', max, maxNum);
% Found that the number with 329 unique combos is 9240

x = 4:2:10000;
y = arr(x);
plot(x, y);