in vec3 mixColor;
out vec4 fragmentColor;

void main() {
  fragmentColor = vec4(mixColor, 1.0);
}