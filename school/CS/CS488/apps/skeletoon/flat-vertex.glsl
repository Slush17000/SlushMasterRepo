uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromPose;
uniform mat4 jointTransforms[JOINT_TRANSFORM_COUNT];

in vec3 position;
in vec3 normal;
in vec3 color;
in vec4 joints;
in vec4 weights;

out vec3 mixNormal;
out vec3 mixColor;
out vec3 mixPositionEye;
out vec3 vertexColor;

void main() {
  // Compute the joint transforms according to the weights
  mat4 poseFromModel = weights.x * jointTransforms[int(joints.x)] +
    weights.y * jointTransforms[int(joints.y)] +
    weights.z * jointTransforms[int(joints.z)] +
    weights.w * jointTransforms[int(joints.w)];

  vec4 worldPosition = worldFromPose * poseFromModel * vec4(position, 1.0);

  mixPositionEye = (eyeFromWorld * worldPosition).xyz;
  mixNormal = (eyeFromWorld * worldFromPose * poseFromModel * vec4(normal, 0.0)).xyz;
  mixColor = color;
  vertexColor = normalize(normal) * 0.5 + 0.5;

  gl_Position = clipFromEye * eyeFromWorld * worldPosition;
}
