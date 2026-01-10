%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow & Michael Berry
% JMU-EID: derrowjb & berrymw
% DATE: May 11, 2025
% 
% PROGRAM: brownmotion2d.m
% PURPOSE: Simulates two-dimensional brownian motion.
%
% VARIABLES: 
%    out = return array containing the total number of iterations simulated 
%          and the maximum distance away from the origin reached
%    pos = current position of the particle
%    iter = current iteration of the simulation
%    maxdist = maximum Euclidean distance away from the origin reached
%    upperlimit = threshold value to limit the number of iterations of 
%                 brownmotion2d
%    r = random value between 0 and 1
%    dist = current Euclidean distance away from the origin
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = brownmotion2d()
    out = [0, 0];
    pos = [0, 0];
    iter = 1;
    maxdist = 1;
    upperlimit = 100000;

    % Initial movement
    r = rand();
    if r < 0.25
        pos = pos + [0, 1];  % Move up
    elseif r < 0.5
        pos = pos + [0, -1]; % Move down
    elseif r < 0.75
        pos = pos + [-1, 0]; % Move left
    else
        pos = pos + [1, 0];  % Move right
    end

    % Further movement until the particle returns to the origin
    while (any(pos ~= 0)) && (iter < upperlimit)
        r = rand();
        if r < 0.25
            pos = pos + [0, 1];  % Move up
        elseif r < 0.5
            pos = pos + [0, -1]; % Move down
        elseif r < 0.75
            pos = pos + [-1, 0]; % Move left
        else
            pos = pos + [1, 0];  % Move right
        end

        iter = iter + 1;

        % Euclidean distance from origin
        dist = sqrt(pos(1)^2 + pos(2)^2);
        if dist > maxdist
            maxdist = dist;
        end
    end

    if iter == upperlimit
        fprintf("Particle did not return to the origin after %d iterations\n", upperlimit);
    end

    fprintf("Number of iterations simulated: %d\n", iter);
    fprintf("Maximum distance away from the origin reached: %.3f\n", maxdist);
    out(1) = iter;
    out(2) = maxdist;
end