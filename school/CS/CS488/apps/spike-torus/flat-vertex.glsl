uniform mat4 clipFromWorld;
uniform float radians;
uniform vec3 offsets;
uniform vec3 factors;

in vec3 position;
in vec3 normal;
out vec3 mixNormal;

void main() {
  mixNormal = normal;
    // Rotation about Y axis
  float c = cos(radians);
  float s = sin(radians);

// mat3 rot = mat3(
//   1.0,    0.0,     0.0,
//   0.0,  c, -s,
//   0.0,  s,  c
//   );

  // rotation matrix for Y axis
 mat3 rot = mat3(
  c,  0.0,  s,
     0.0,   1.0,    0.0,
 -s,  0.0,  c
);

  // rotation matrix about Z axis
//   mat3 rot = mat3(
//   c, -s,  0.0,
//   s,  c,  0.0,
//      0.0,      0.0,    1.0
// );

  vec3 rotatedPosition = position * rot;
  vec3 scaledPosition = factors * rotatedPosition;
  vec3 translatedPosition = scaledPosition + offsets;
  gl_Position = clipFromWorld * vec4(translatedPosition, 1.0);
  gl_PointSize = 10.0;
}