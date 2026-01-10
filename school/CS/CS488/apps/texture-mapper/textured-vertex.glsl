in vec3 position;
in vec2 texPosition;
in vec3 normal;

uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromModel;

out vec2 mixTexPosition;
out vec3 mixNormalEye;
out vec3 mixPositionEye;

void main() {
  // Transform position to world space then to eye space
  vec4 worldPosition = worldFromModel * vec4(position, 1.0);
  vec4 eyePosition = eyeFromWorld * worldPosition;
  mixPositionEye = eyePosition.xyz;
  
  gl_Position = clipFromEye * eyePosition;
  
  mixTexPosition = texPosition;
  mixNormalEye = (eyeFromWorld * worldFromModel * vec4(normal, 0.0)).xyz;
}
