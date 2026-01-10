%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 15, 2025
% 
% PROGRAM: hilbert.m
% PURPOSE: Solve ax=b using Hilbert matrices.
%
% VARIABLES: 
%    n = positive integer that represents the size of the system of
%    equations
%    H = Hilbert matrix
%    b = output vector
%    x = solution to the system
%    error = absolute error
%    cond_num = condition number of the Hilbert matrix
%    lost_digits = estimated amount of accuracy digits lost
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% The max errors in part b increase as the system grows in size, just like
% in part a, so this follows the error trend seen in part a. The expected 
% errors in part b also increase and more digits of accuracy are lost every 
% time the system grows in size.

for n = [5, 10, 15]
    H = hilb(n);
    b = zeros(n, 1);

    for i = 1:n
        b(i) = sum(1 ./ (i:i+n-1));
    end

    x = H \ b;
    error = max(abs(x - 1));
    cond_num = cond(H);
    lost_digits = log10(cond_num);

    fprintf('n = %d\n', n);
    fprintf('  Condition number: %.2e\n', cond_num);
    fprintf('  log10(cond): %.2f digits lost\n', lost_digits);
    fprintf('  Max error: %.2e\n', error);
    fprintf('  Expected error: %.2e\n', cond_num * 1e-16);
end