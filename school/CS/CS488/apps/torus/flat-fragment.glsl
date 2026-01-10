in vec3 mixNormal;
out vec4 fragmentColor;
uniform vec3 colorParam;

void main() {

  float eps = 1e-3;
  float len = length(mixNormal);
  if(len < eps) {

    if(mixNormal.z > 0.0) {
      fragmentColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
      fragmentColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
  } else {
    vec3 n = normalize(mixNormal);
    fragmentColor = vec4(colorParam * (n * 0.5 + .5), 1.0);
  }
}