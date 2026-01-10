%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: March 10, 2025
% 
% PROGRAM: testpalin.m
% PURPOSE: Outputs the number of palindromic products for two 3-digit
%          numbers.
%
% VARIABLES: 
%    product = product of the two loop index variables, possibly
%              palindromic
%    count = number of palindromic products
%    a = first loop index variable
%    b = second loop index variable
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% There are a total of 1239 palindromic products for two 3-digit numbers.

product = 0;
count = 0;
for a = 100:999
    for b = a:999
        product = a * b;
        if(palin(product) == true)
            count = count + 1;
            fprintf('%d. %d * %d = %d\n', count, a, b, product); 
        end
    end
end
fprintf('There are a total of %d palindromic products with a <= b, 100 <= a <= 999, 100 <= b <= 999)\n', count);