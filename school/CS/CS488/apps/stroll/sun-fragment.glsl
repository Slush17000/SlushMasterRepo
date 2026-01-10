out vec4 fragmentColor;

const vec3 sunColor = vec3(1.0, 0.9, 0.2); // Bright yellow/orange color like the sun

void main() {
  fragmentColor = vec4(sunColor, 1.0);
}