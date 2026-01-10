x=input('Enter x: ');
y=input('Enter y: ');

% Brute force one quadrant at a time
if x>=0 && y>=0
    disp('First');
elseif x<0 && y>=0
    disp('Second')
elseif x<0 && y<0
    disp('Third');
else
    disp('Fourth');
end

% Compare x and y once
if x>=0
    if y>=0
        disp('First');
    else
        disp('Fourth');
    end
else
    if y>=0
        disp('Second');
    else
        disp('Third');
    end
end