uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromModel;

in vec3 position;
in vec3 normal;

out vec3 mixNormalWorld;
out vec3 mixPositionWorld;

void main() {
  // Transform position to world space
  vec4 worldPosition = worldFromModel * vec4(position, 1.0);
  mixPositionWorld = worldPosition.xyz;

  gl_Position = clipFromEye * eyeFromWorld * worldPosition;


  mixNormalWorld = (worldFromModel * vec4(normal, 0.0)).xyz;
}