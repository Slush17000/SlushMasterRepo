%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow & Michael Berry
% JMU-EID: derrowjb & berrymw
% DATE: May 11, 2025
% 
% PROGRAM: testbrownmotion1d.m
% PURPOSE: Tests the one-dimensional brownian motion simulation.
%
% VARIABLES:
%    iters = an array containing the number of iterations for each run of
%            brownmotion1d
%    dists = an array containing the maximum distance reached for each run 
%            of brownmotion1d
%    totaliters = total number of iterations across all calls to
%                 brownmotion1d; used to compute the average
%    totalmaxdist = total maximum distance reached across all calls to
%                   brownmotion1d; also used to compute the average
%    upperlimit = threshold value to limit the number of iterations of 
%                 brownmotion1d
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
upperlimit = 20000;

for i = 1:1000
    k = brownmotion1d();

    while k(1) > upperlimit
        k = brownmotion1d();
    end

    iters(i) = k(1);
    dists(i) = k(2);
    totaliters = totaliters + k(1);
    totalmaxdist = totalmaxdist + k(2);
end

averageiters = totaliters / 1000;
averagemax = totalmaxdist / 1000;
disp(averageiters);
disp(averagemax);

freqiters = zeros(1, 1000);
freqdists = zeros(1, 1000);
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

    freqiters(curriter) = freqiters(curriter) + 1;
    freqdists(currdist) = freqdists(currdist) + 1;
end