uniform mat4 clipFromWorld;
uniform mat4 worldFromModel;

in vec3 position;

void main() {
  gl_Position = clipFromWorld * worldFromModel * vec4(position, 1.0);
  gl_PointSize = 10.0;
}