uniform mat4 clipFromWorld;
uniform mat4 worldFromModel;

in vec3 position;
in vec3 color;

out vec3 mixPosition;
out vec3 mixColor;

void main() {
  vec4 worldPosition = worldFromModel * vec4(position, 1.0);
  mixPosition = worldPosition.xyz;
  mixColor = color;
  gl_Position = clipFromWorld * worldPosition;
}
