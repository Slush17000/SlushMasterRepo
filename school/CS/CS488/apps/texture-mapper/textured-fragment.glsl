uniform sampler2D crateTexture;
uniform vec3 lightPositionEye;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float ambientFactor;
uniform float shininess;

in vec2 mixTexPosition;
in vec3 mixNormalEye;
in vec3 mixPositionEye;

out vec4 fragmentColor;

void main() {
  vec3 normal = normalize(mixNormalEye);
  if (!gl_FrontFacing) {
    normal = -normal;
  }
  vec3 lightDirection = normalize(lightPositionEye - mixPositionEye);
  
  // Get texture color
  vec3 albedo = texture(crateTexture, mixTexPosition).rgb;
  
  // Diffuse lighting factor
  float litness = max(0.0, dot(normal, lightDirection));
  
  // Ambient term
  vec3 ambient = ambientFactor * albedo * diffuseColor;
  
  // Diffuse term
  vec3 diffuse = (1.0 - ambientFactor) * litness * albedo * diffuseColor;
  
  // Specular term
  vec3 eyeDirection = normalize(-mixPositionEye);
  vec3 halfDirection = normalize(eyeDirection + lightDirection);
  float specularity = pow(max(0.0, dot(halfDirection, normal)), shininess);
  vec3 specular = specularity * specularColor;
  
  vec3 rgb = ambient + diffuse + specular;
  fragmentColor = vec4(rgb, 1.0);
}
