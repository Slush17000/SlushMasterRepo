%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% NAME: Josh Derrow
% JMU-EID: derrowjb
% DATE: January 24, 2025
% 
% PROGRAM: ctof.m
% PURPOSE: Celsius to Fahrenheit
%
% VARIABLES: 
%    celsius_temp  = input temperature in Celsius
%    fahrenheit_temp = output temperature in Fahrenheit
%
% JMU PLEDGE
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

celsius_temp = input('Enter a temperature in Celsius: ');
fahrenheit_temp = ((9 * celsius_temp) / 5) + 32;
fprintf('%4.2f°C = %4.2f°F \n', celsius_temp, fahrenheit_temp)