%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 7, 2025
% 
% PROGRAM: pythag.m
% PURPOSE: Finds a Pythagorean Triplet such that a + b + c = 1000
%
% VARIABLES: 
%    a, b, c = index variables to find Pythagorean triplet
%    sum = sum of the index variables
%    left = left side of the Pythagorean theorem equation (a^2 + b^2)
%    right = right side of the Pythagorean theorem equation (c^2)
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

for a = 1:1000
    for b = 1:1000
        for c = 1:1000
            if (a < b) && (b < c) && (a^2 + b^2 == c^2) && ((a + b + c) == 1000)
                sum = a + b + c; % Should be 1000
                % Left and right should be equal
                left = a^2 + b^2;
                right = c^2;
                fprintf('Pythagorean Triplet: a = %d, b = %d, c = %d\n', a, b, c);
                fprintf('Sum: %d + %d + %d = %d\n', a, b, c, sum);
                fprintf('Pythagorean Theorem: a^2 + b^2 = c^2: %d = %d\n', left, right);
            end
        end
    end
end