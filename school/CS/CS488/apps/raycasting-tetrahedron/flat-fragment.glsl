uniform vec3 lightPositionEye;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float ambientFactor;
uniform float shininess;
uniform vec3 albedo;
uniform float alpha;

in vec3 mixPositionEye;
in vec3 mixNormalEye;

out vec4 fragmentColor;

void main() {
  vec3 normal = normalize(mixNormalEye);
  vec3 lightDirection = normalize(lightPositionEye - mixPositionEye);

  float litness = max(0.0, dot(normal, lightDirection));

  vec3 ambient = ambientFactor * albedo * diffuseColor;
  vec3 diffuse = (1.0 - ambientFactor) * litness * albedo * diffuseColor;

  vec3 eyeDirection = normalize(-mixPositionEye);
  vec3 halfDirection = normalize(eyeDirection + lightDirection);
  float specularity = pow(max(0.0, dot(halfDirection, normal)), shininess);
  vec3 specular = specularity * specularColor;

  vec3 rgb = ambient + diffuse + specular;
  fragmentColor = vec4(rgb, alpha);
}
