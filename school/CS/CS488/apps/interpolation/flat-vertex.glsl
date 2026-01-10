in vec3 position;
in vec3 color;
out vec3 mixColor;

void main() {
  gl_Position = vec4(position, 1.0);
  mixColor = color;
}