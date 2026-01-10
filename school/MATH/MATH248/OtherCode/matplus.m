%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: March 30, 2025
% 
% PROGRAM: matplus.m
% PURPOSE: Function to add two matrices together (C = A + B).
%
% VARIABLES: 
%    c = return matrix sum value
%    a = first matrix input value
%    b = second matrix input value
%    ma = number of rows in a
%    na = number of columns in a
%    mb = number of rows in b
%    nb = number of columns in b
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function c = matplus(a, b)
    [ma, na] = size(a);
    [mb, nb] = size(b);
    if (ma ~= mb) || (na ~= nb) % different size matrices
        error('Matrices a and b are different sizes');
    else
        c = zeros(ma, na);
        % Traverse the rows and columns of both matrices
        for i = 1:ma
            for j = 1:na
                c(i, j) = a(i, j) + b(i, j); % Add numbers
            end
        end
    end
end