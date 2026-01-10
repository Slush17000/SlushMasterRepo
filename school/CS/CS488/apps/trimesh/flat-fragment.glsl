in vec3 mixColor;
in vec3 mixNormal;
out vec4 fragmentColor;

void main() {
  fragmentColor = vec4(normalize(mixNormal), 1.0);
  // White Mesh:
  // fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
}