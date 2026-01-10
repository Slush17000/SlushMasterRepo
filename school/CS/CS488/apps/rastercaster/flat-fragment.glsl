uniform vec2 dimensions;
uniform vec2 mouse;
uniform float time;

out vec4 fragmentColor;

vec3 f() {
  // Define a vec3 named color.
  // USER_CODE
  return color;
}

void main() {
  vec3 color = f();
  fragmentColor = vec4(color, 1.0);
}
