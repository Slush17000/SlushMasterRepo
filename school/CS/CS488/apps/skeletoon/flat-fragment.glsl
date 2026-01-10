uniform vec3 lightPositionEye;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float ambientFactor;
uniform float shininess;
uniform vec3 albedo;
uniform int useVertexColor;

in vec3 mixPositionEye;
in vec3 mixNormal;
in vec3 mixColor;

out vec4 fragmentColor;

void main() {
  // Compute lighting using Blinn-Phong illumination
  vec3 lightDirection = normalize(lightPositionEye - mixPositionEye);
  vec3 normal = normalize(mixNormal);
  float litness = max(0.0, dot(normal, lightDirection));
  vec3 baseColor = useVertexColor == 1 ? mixColor : albedo;

  vec3 ambient = ambientFactor * baseColor * diffuseColor;

  vec3 diffuse = (1.0 - ambientFactor) * litness * baseColor * diffuseColor;

  vec3 eyeDirection = normalize(-mixPositionEye);
  vec3 halfDirection = normalize(eyeDirection + lightDirection);
  float specularity = pow(max(0.0, dot(halfDirection, normal)), shininess);
  vec3 specular = specularity * specularColor;

  vec3 rgb = ambient + diffuse + specular;
  fragmentColor = vec4(rgb, 1.0);
}
