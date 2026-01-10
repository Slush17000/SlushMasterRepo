uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromPose;
uniform mat4 jointTransforms[JOINT_TRANSFORM_COUNT];

in vec3 position;
in vec3 normal;
in vec4 joints;
in vec4 weights;
out vec3 mixNormal;
out vec3 vWorldPos;

void main() {
  // Calculate the pose transformation from model space
  mat4 poseFromModel = 
    weights.x * jointTransforms[int(joints.x)] +
    weights.y * jointTransforms[int(joints.y)] +
    weights.z * jointTransforms[int(joints.z)] +
    weights.w * jointTransforms[int(joints.w)];
  
  gl_Position = clipFromEye * eyeFromWorld * worldFromPose * poseFromModel * vec4(position, 1.0);
  mixNormal = normal;
  vWorldPos = (worldFromPose * poseFromModel * vec4(position, 1.0)).xyz;
}