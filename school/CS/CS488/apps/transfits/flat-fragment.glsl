uniform vec3 rgb;

out vec4 fragmentColor;

void main() {
  fragmentColor = vec4(rgb, 1.0);
}