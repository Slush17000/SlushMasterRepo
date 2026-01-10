uniform mat4 clipFromEye;
uniform mat4 eyeFromWorld;
uniform mat4 worldFromModel;
uniform mat4 jointTransforms[JOINT_TRANSFORM_COUNT];

in vec3 position;
in vec3 normal;
in vec2 texPosition;
in vec4 joints;
in vec4 weights;

out vec3 mixNormalEye;
out vec3 mixPositionEye;
out vec2 mixTexPosition;

void main() {
  // Check if this vertex is skinned (has non-zero weights)
  bool isSkinned = (weights.x + weights.y + weights.z + weights.w) > 0.0;
  
  vec4 skinnedPosition;
  vec3 skinnedNormal;
  
  if (isSkinned) {
    // Calculate the pose transformation from model space
    mat4 poseFromModel = 
      weights.x * jointTransforms[int(joints.x)] +
      weights.y * jointTransforms[int(joints.y)] +
      weights.z * jointTransforms[int(joints.z)] +
      weights.w * jointTransforms[int(joints.w)];
    
    skinnedPosition = poseFromModel * vec4(position, 1.0);
    skinnedNormal = (poseFromModel * vec4(normal, 0.0)).xyz;
  } else {
    // Not skinned, use original position and normal
    skinnedPosition = vec4(position, 1.0);
    skinnedNormal = normal;
  }
  
  // Transform position to world space then to eye space
  vec4 worldPosition = worldFromModel * skinnedPosition;
  vec4 eyePosition = eyeFromWorld * worldPosition;
  mixPositionEye = eyePosition.xyz;

  gl_Position = clipFromEye * eyePosition;
  mixNormalEye = (eyeFromWorld * worldFromModel * vec4(skinnedNormal, 0.0)).xyz;
  mixTexPosition = texPosition;
}