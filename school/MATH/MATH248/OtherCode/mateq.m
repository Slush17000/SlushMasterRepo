%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: March 26, 2025
% 
% PROGRAM: mateq.m
% PURPOSE: Function to return true if matrices a and b are equal (false 
%          otherwise).
%
% VARIABLES: 
%    out = boolean return value indicating whether the two matrices are
%          equal or not
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

function out = mateq(a, b)
    [ma, na] = size(a);
    [mb, nb] = size(b);
    if (ma ~= mb) || (na ~= nb) % different size matrices
        out = false;
    else
        out = true; % initially assume true
        for i = 1:ma % traverses each row
            for j = 1:na % traverses each column
                if (a(i, j) ~= b(i, j)) % different value found
                    out = false;
                end
            end
        end
    end
end