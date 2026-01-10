%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow & Michael Berry
% JMU-EID: derrowjb & berrymw
% DATE: May 11, 2025
% 
% PROGRAM: teststepbrownmotion2d.m
% PURPOSE: Tests the two-dimensional brownian motion simulation with an 
%          iteration limit.
%
% VARIABLES:
%    iters = an array containing the number of iterations for each run of
%            brownmotion2d
%    dists = an array containing the maximum distance reached for each run 
%            of brownmotion2d
%    totaliters = total number of iterations across all calls to
%                 brownmotion2d; used to compute the average
%    totalmaxdist = total maximum distance reached across all calls to
%                   brownmotion2d; also used to compute the average
%    upperlimit = threshold value to limit the number of iterations of 
%                 brownmotion2d
%    k = temporary array that stores the current number of iterations and
%        the current maximum distance reached
%    averageiters = average number of iterations per run
%    averagemax = average maximum distance per run
%    freqiters = an array storing the frequencies of each iteration count
%                (freqiters(i) = the number of times iteration is equal to 
%                i (min i is 2))
%    freqdists = an array storing the frequencies of each maximum distance
%                reached (freqdists(i) = the number of times the max 
%                distance is i (min i is 1))
%    iteroverthous = a counter for the runs that had over 1000 iterations
%    distoverthous = a counter for the runs that had maximum distances over
%                    1000
%    curriter = temporary current value of iters(i)
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

iters = zeros(1, 1000);
dists = zeros(1, 1000);
totaliters = 0;
totalmaxdist = 0;
upperlimit = input("Please enter an upper iteration limit: ");

for i = 1:1000
    k = stepbrownmotion2d(upperlimit);

    while k(1) > upperlimit
        k = stepbrownmotion2d(upperlimit);
    end

    iters(i) = k(1);
    dists(i) = k(2);
    totaliters = totaliters + k(1);
    totalmaxdist = totalmaxdist + k(2);
end

averageiters = totaliters / 1000;
averagemax = totalmaxdist / 1000;
fprintf("Average number of iterations: %.3f\n", averageiters);
fprintf("Average max distance reached: %.3f\n", averagemax);

iteroverthous = 0;
distoverthous = 0;

for i = 1:1000
    curriter = iters(i);
    if curriter > 1000
        iteroverthous = iteroverthous + 1;
        continue
    end

    currdist = dists(i);
    if currdist > 1000
        distoverthous = distoverthous + 1;
        continue
    end
end

edges = 0:upperlimit;
freqdists = histcounts(dists, edges);
freqiters = histcounts(iters, edges);

% Distribution plotting:
% Iterations
figure;
bar(1:upperlimit, freqiters, 'FaceColor', [0.2 0.6 0.8]);
xlim([0 upperlimit]);
xlabel('Number of Iterations');
ylabel('Frequency');
title('Distribution of Steps to Return to Origin (2D Brownian Motion)');

% Distances
figure;
bar(1:upperlimit, freqdists, 'FaceColor', [0.8 0.4 0.2]);
xlim([0 upperlimit]);
xlabel('Maximum Distance Reached');
ylabel('Frequency');
title('Distribution of Maximum Distance Reached (2D Brownian Motion)');