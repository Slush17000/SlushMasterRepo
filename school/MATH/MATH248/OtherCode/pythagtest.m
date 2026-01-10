%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: February 18, 2025
% 
% PROGRAM: pythagtest.m
% PURPOSE: Pythagorean Examples
%
% VARIABLES: 
%    a, b, c = index variables to find Pythagorean triplet
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% 1 - Brute Force
fprintf('Example 1 - Brute Force\n');
tic
for a = 1:1000
    for b = 1:1000
        for c = 1:1000
            if (a < b) && (b < c) && (a^2 + b^2 == c^2) && ((a + b + c) == 1000)
                disp([a, b, c]);
            end
        end
    end
end
toc
fprintf('\n');

% 2 - Improved Loop Bounds
fprintf('Example 2 - Improved Loop Bounds\n');
tic
for a = 1:1000
    for b = a:1000
        for c = b:1000
            if (a + b + c == 1000) && (a^2 + b^2 == c^2)
                disp([a, b, c]);
            end
        end
    end
end
toc
fprintf('\n');

% 3 - Double Loop, c = 1000 - a - b
fprintf('Example 3 - Double Loop\n');
tic
for a = 1:1000
    for b = a:1000
        c = 1000 - a - b;
        if (a^2 + b^2 == c^2) && (b <= c)
            disp([a, b, c]);
        end
    end
end
toc
fprintf('\n');

% 4 - Improved Bounds Double Loop, c = 1000 - a - b
fprintf('Example 4 - Improved Bounds Double Loop\n');
tic
for a = 1:333
    for b = a:500 - a/2
        c = 1000 - a - b;
        if (a^2 + b^2 == c^2) && (b <= c)
            disp([a, b, c]);
        end
    end
end
toc
fprintf('\n');