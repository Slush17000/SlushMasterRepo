%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Michael Berry & Josh Derrow
% JMU-EID: derrowjb
% DATE: March 30, 2025
% 
% PROGRAM: prime.m
% PURPOSE: Determines if a number is prime or not.
%
% VARIABLES: 
%    ret = boolean return value indicating if the input value is prime or
%          not
%    n = input value
%    upto = upper limit for prime checking
%    
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function ret = prime(n)
    if (n == 1)
        ret = 0;
        return
    end
    upto = floor(sqrt(n));
    for i = 2:upto
       if (mod(n, i) == 0)
           ret = 0;
           return
       end
    end
    ret = 1;
end