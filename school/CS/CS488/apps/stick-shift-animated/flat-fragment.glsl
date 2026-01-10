in vec3 mixNormal;
in vec3 vWorldPos;
out vec4 fragmentColor;

void main() {
  // Simple directional light
  vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
  // Derivative-based normal (flat shading hack)
  vec3 dpx = dFdx(vWorldPos);
  vec3 dpy = dFdy(vWorldPos);
  vec3 normal = normalize(cross(dpx, dpy));
  float litness = max(0.0, dot(normal, lightDirection));
  vec3 finalColor = mixNormal * litness; // add ambient term
  fragmentColor = vec4(.03 + finalColor, 1.0);
}