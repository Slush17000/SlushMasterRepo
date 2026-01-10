%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow & Michael Berry
% JMU-EID: derrowjb & berrymw
% DATE: May 11, 2025
% 
% PROGRAM: stepbrownmotion1d.m
% PURPOSE: Simulates one-dimensional brownian motion with a user-inputted 
%          iteration limit.
%
% VARIABLES: 
%    n = iteration limit
%    out = return array containing the total number of iterations simulated 
%          and the maximum distance away from the origin reached
%    pos = current position of the particle
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function out = stepbrownmotion1d(n)
    pos = 0;

    for i = 1:n
        if rand() < 0.5
            pos = pos - 1;
        else
            pos = pos + 1;
        end
    end
    
    out = pos;
end