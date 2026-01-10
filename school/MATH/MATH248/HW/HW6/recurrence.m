%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 10, 2025
% 
% PROGRAM: recurrence.m
% PURPOSE: Solves the recurrence relations p and q to find p30 and q30.
%
% VARIABLES: 
%    p = first recurrence relation
%    q = second recurrence relation
%    n = current iteration of the recurrence
%    p_exact = exact value of p_30
%    q_exact = exact value of q_30
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Initialize p and q arrays
p = zeros(1, 30);
q = zeros(1, 30);

% Initial conditions
p(1) = 1/3;
q(1) = 1/3;
q(2) = 1/9;

% Recurrence for p
for n = 2:30
    p(n) = (1/3) * p(n-1);
end

% Recurrence for q
for n = 3:30
    q(n) = (4 * q(n-1)) - ((11/9) * q(n-2));
end

% Exact values
p_exact = (1/3)^30;
q_exact = (1/3)^30;

% Display results
fprintf('p_30 = %.5e, Error = %.5e\n', p(30), abs(p(30) - p_exact));
fprintf('q_30 = %.5e, Error = %.5e\n', q(30), abs(q(30) - q_exact));