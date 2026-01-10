uniform float scale;
uniform vec3 offset;

in vec3 position;

void main() {
  vec3 scaledPosition = scale * position;
  vec3 translatedPosition = scaledPosition + offset;
  gl_Position = vec4(translatedPosition, 1.0);
  gl_PointSize = 15.0;
}