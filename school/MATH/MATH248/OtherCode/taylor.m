%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: April 29, 2025
% 
% PROGRAM: taylor.m
% PURPOSE: Implement various Taylor methods for an ODE.
%
% VARIABLES: 
%    
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Initialize step sizes, etc.
n = 20;
t = linspace(0, 1, n + 1);
h = (1 - 0) / n;
true = t + exp(-t);
w1 = zeros(1, n + 1);
w1(1) = 1;
w2 = zeros(1, n + 1);
w2(1) = 1;
w4 = zeros(1, n + 1);
w4(1) = 1;

for i = 1:n
    w1(i + 1) = w1(i) + h * (-w1(i) + t(i) + 1);
    w2(i + 1) = w2(i) + h * (-w2(i) + t(i) + 1) + ((h^2) / 2) * (w2(i) - t(i));
    w4(i + 1) = w4(i) + h * (-w4(i) + t(i) + 1) + ((h^2) / 2) * (w4(i) - t(i)) + ((h^3) / 6) * (-w4(i) + t(i)) + ((h^4) / 24) * (w4(i) - t(i));
end

disp(abs(true(n + 1) - w1(n + 1)));
disp(abs(true(n + 1) - w2(n + 1)));
disp(abs(true(n + 1) - w4(n + 1)));
plot(t, true, t, w1, t, w2, t, w4);