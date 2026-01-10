in vec3 position;
in vec2 texPosition;

out vec2 mixTexPosition;

void main() {
  gl_Position = vec4(position, 1.0);
  mixTexPosition = texPosition;
}
