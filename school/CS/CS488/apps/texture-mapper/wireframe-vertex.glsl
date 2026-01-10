in vec2 position;
uniform mat4 clipFromTexture;

void main() {
  gl_Position = clipFromTexture * vec4(position, 0.0, 1.0);
  gl_PointSize = 20.0;
}
