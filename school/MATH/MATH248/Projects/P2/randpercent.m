%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow & Michael Berry
% JMU-EID: derrowjb & berrymw
% DATE: May 11, 2025
% 
% PROGRAM: randpercent.m
% PURPOSE: Simulates one-dimensional brownian motion biased p percent to 
%          the left and 100 - p percent to the right.
%
% VARIABLES: 
%    p = user-inputted motion bias
%    out = return array containing the total number of iterations simulated 
%          and the maximum distance away from the origin reached
%    pos = current position of the particle
%    maxiter = maximum number of iterations limit
%    percent = motion bias as a percent
%    iter = current iteration of the simulation
%    maxdist = maximum distance away from the origin reached
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = randpercent(p)
    pos = 0;
    maxiter = 16000000;
    percent = p / 100;
    iter = 1;
    maxdist = percent;

    % Initial movement
    if rand() < 0.5
        pos = pos - percent;
    else
        pos = pos + percent;
    end

    % Further movement until the particle returns to the origin
    while (pos ~= 0) && (iter < maxiter)
        if rand() < 0.5
            pos = pos - percent;
        else
            pos = pos + percent;
        end

        iter = iter + 1;

        if abs(pos) > maxdist
            maxdist = abs(pos);
        end
    end

    out = [iter, maxdist];
end