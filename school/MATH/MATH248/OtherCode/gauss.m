%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 2, 2025
% 
% PROGRAM: gauss.m
% PURPOSE: Solve ax=b by Gaussian elimination.
%
% VARIABLES: 
%    x = 
%    a = 
%    b = 
%    n1 = 
%    n2 = 
%    n3
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function x = gauss(a, b)
    [n1, n2] = size(a); 
    n3 = length(b);
    if n1 ~= n2 || n1 ~= n3
        error('Size mismatch');
    end
    n = n1;
    for k = 1:n-1   % k is column number
        if a(k, k) == 0   % zero on main diagonal
            i = k+1;
            while (i < n) && (a(i, k) == 0)   % find first nonzero
                i = i + 1;               % in column
            end
            if a(i, k) == 0
                error('No unique solution');
            else   % swap rows i and k
                for j = k:n
                    t = a(i, j); 
                    a(i, j) = a(k, j); 
                    a(k, j) = t;
                end
                t = b(i); 
                b(i) = b(k); 
                b(k) = t;
            end
        end
        for i = k+1:n   % i is row number
            t = a(i, k) / a(k, k);
            a(i, k) = 0;   % zero first element of row
            for j = k+1:n   % the row operation
                a(i, j) = a(i, j) - t * a(k, j);
            end
            b(i) = b(i) - t * b(k);   % rhs as well
        end
    end
    % Now do back substitution
    x = zeros(n1, 1);
    x(n) = b(n) / a(n, n);
    for i = n-1:-1:1
        x(i) = b(i);
        for k = i+1:n
            x(i) = x(i) - a(i, k) * x(k);
        end
        x(i) = x(i) / a(i, i);
    end
end