uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromModel;

in vec3 position;
in vec3 normal;

out vec3 mixNormalEye;
out vec3 mixPositionEye;

void main() {
  vec4 worldPosition = worldFromModel * vec4(position, 1.0);
  vec4 eyePosition = eyeFromWorld * worldPosition;
  mixPositionEye = eyePosition.xyz;

  gl_Position = clipFromEye * eyePosition;

  mat3 normalMatrix = mat3(eyeFromWorld * worldFromModel);
  mixNormalEye = normalMatrix * normal;
}
