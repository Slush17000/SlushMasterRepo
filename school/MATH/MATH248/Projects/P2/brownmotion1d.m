%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow & Michael Berry
% JMU-EID: derrowjb & berrymw
% DATE: May 11, 2025
% 
% PROGRAM: brownmotion1d.m
% PURPOSE: Simulates one-dimensional brownian motion.
%
% VARIABLES: 
%    out = return array containing the total number of iterations simulated 
%          and the maximum distance away from the origin reached
%    pos = current position of the particle
%    iter = current iteration of the simulation
%    maxdist = maximum distance away from the origin reached
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = brownmotion1d()
    out = [0, 0];
    pos = 0;
    iter = 1;
    maxdist = 1;
    
    % Initial movement
    if rand() < 0.5
        pos = pos - 1;
    else
        pos = pos + 1;
    end

    % Further movement until the particle returns to the origin
    while pos ~= 0
        if rand() < 0.5
            pos = pos - 1;
        else
            pos = pos + 1;
        end

        iter = iter + 1;

        if abs(pos) > maxdist
            maxdist = abs(pos);
        end
    end

out(1) = iter;
out(2) = maxdist;
end