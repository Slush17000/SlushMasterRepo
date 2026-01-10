in vec3 mixPosition;
in vec3 mixColor;

out vec4 fragmentColor;

void main() {
  vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
  
  vec3 right = dFdx(mixPosition);
  vec3 up = dFdy(mixPosition);
  vec3 normal = normalize(cross(right, up));
  float litness = max(0.0, dot(normal, lightDirection));
  
  vec3 rgb = mixColor * litness;
  fragmentColor = vec4(rgb, 1.0);
}
