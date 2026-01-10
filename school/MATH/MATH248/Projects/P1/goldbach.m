%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Michael Berry & Josh Derrow
% JMU-EID: derrowjb
% DATE: March 30, 2025
% 
% PROGRAM: goldbach.m
% PURPOSE: Return number of unique prime sum duos.
%
% VARIABLES: 
%    ret = return value and total number of prime sum duos
%    lprimes = list of primes from listprimes.m
%    even = an even number greater than or equal to 4
%    
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function ret = goldbach(lprimes, even)
    % Return number of unique ways to sum up to even with primes
    if (even < 4) || (mod(even, 2) == 1)
        error('Number must be >= 4 and even');
    end
    
    ret = 0;

    for k = 2:(even / 2)
        if lprimes(k) && lprimes(even - k)
            ret = ret + 1;
        end
    end
end