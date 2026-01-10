uniform mat4 clipFromWorld;
uniform mat4 transform;
in vec3 position;

in vec3 normal;
out vec3 mixNormal;

void main() {
  mixNormal = normal;

  gl_Position = clipFromWorld * transform * vec4(position, 1.0);
  gl_PointSize = 3.0;
}