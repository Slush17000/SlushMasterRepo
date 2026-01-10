%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 14, 2025
% 
% PROGRAM: pow.m
% PURPOSE: Finds the largest Eigenvalue of the matrix A.
%
% VARIABLES: 
%    result = output value
%    A = first input matrix value
%    b = second input matrix value
%    tol = convergence tolerance
%    max_i = maximum amount of iterations to prevent an infinite loop
%    i = current iteration
%    Ab = matrix product
%    newb = new matrix b value
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Test Output with A = [1,2,3;2,1,4;3,4,5]; b = [1;1;1];
% pow(A, b): ans = 9.0795
% eig(A): ans = -1.4870
%               -0.5925
%                9.0795
% It appears that this method is finding the largest Eigenvalue for the
% matrix A.


function result = pow(A, b)
    % Check that dimensions match
    if size(A, 1) ~= size(A, 2) || size(A, 1) ~= length(b)
        error('A must be square and dimensions of A and b must match.');
    end

    tol = 1e-10;
    max_i = 1000;
    i = 0;

    while true
        Ab = A * b;
        newb = Ab / norm(Ab);

        if max(abs(newb - b)) < tol
            break;
        end

        b = newb;
        i = i + 1;

        if i > max_i
            warning('Divergent');
            break;
        end
    end

    result = (b' * A * b) / (b' * b);
end