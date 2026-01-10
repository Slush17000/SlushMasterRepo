uniform vec3 lightPositionWorld;
uniform vec3 cameraPositionWorld;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float ambientFactor;
uniform float shininess;
uniform vec3 albedo;

in vec3 mixPositionWorld;
in vec3 mixNormalWorld;

out vec4 fragmentColor;

void main() {
  vec3 normal = normalize(mixNormalWorld);

  vec3 lightDirection = normalize(lightPositionWorld - mixPositionWorld);

  // Diffuse lighting factor
  float litness = max(0.0, dot(normal, lightDirection));

  // Ambient term
  vec3 ambient = ambientFactor * albedo * diffuseColor;

  // Diffuse term
  vec3 diffuse = (1.0 - ambientFactor) * litness * albedo * diffuseColor;

  // Specular term (Blinn-Phong) in world space
  vec3 eyeDirection = normalize(cameraPositionWorld - mixPositionWorld);
  vec3 halfDirection = normalize(eyeDirection + lightDirection);
  float specularity = pow(max(0.0, dot(halfDirection, normal)), shininess);
  vec3 specular = specularity * specularColor;

  vec3 rgb = ambient + diffuse + specular;
  fragmentColor = vec4(rgb, 1.0);
}