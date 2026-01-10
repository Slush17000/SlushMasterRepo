uniform mat4 clipFromWorld;
uniform float radians1;
uniform float radians2;
uniform vec3 offsets;
uniform vec3 factors;

in vec3 position;
in vec3 normal;
out vec3 mixNormal;

void main() {
  // Rotation around X axis
  float c1 = cos(radians1);
  float s1 = sin(radians1);
  mat3 rot1 = mat3(1.0, 0.0, 0.0, 
                   0.0, c1, -s1, 
                   0.0, s1, c1);

  // Rotation around Y axis
  float c2 = cos(radians2);
  float s2 = sin(radians2);
  mat3 rot2 = mat3(c2, 0.0, s2, 
                   0.0, 1.0, 0.0, 
                   -s2, 0.0, c2);

  // Rotation around Z axis
  // float c3 = cos(radians);
  // float s3 = sin(radians);
  //   mat3 rot3 = mat3(
  //   c, -s,  0.0,
  //   s,  c,  0.0,
  //   0.0,      0.0,    1.0
  // );

  vec3 rotatedPositionX = rot1 * position;
  vec3 rotatedPosition = rot2 * rotatedPositionX;
  vec3 scaledPosition = factors * rotatedPosition;
  vec3 translatedPosition = scaledPosition + offsets;

  gl_Position = clipFromWorld * vec4(translatedPosition, 1.0);
  gl_PointSize = 10.0;
  mixNormal = normal;
}
