uniform sampler2D grassTexture;
uniform sampler2D platformTexture;
uniform vec3 lightPositionEye;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float ambientFactor;
uniform float shininess;
uniform vec3 albedo;
uniform bool playerTexture;
uniform bool usePlatformTexture;

in vec3 mixPositionEye;
in vec3 mixNormalEye;
in vec2 mixTexPosition;

out vec4 fragmentColor;

void main() {
  // Normalize the interpolated normal
  vec3 normalEye = normalize(mixNormalEye);

  // Calculate lighting vectors
  vec3 toLightEye = normalize(lightPositionEye - mixPositionEye);
  vec3 toEyeEye = normalize(-mixPositionEye);
  vec3 halfEye = normalize(toLightEye + toEyeEye);
  
  // Sample texture to get albedo color
  vec3 textureAlbedo;
  if(playerTexture) {
    textureAlbedo = albedo;
  } else if(usePlatformTexture) {
    textureAlbedo = texture(platformTexture, mixTexPosition).rgb;
  } else {
    textureAlbedo = texture(grassTexture, mixTexPosition).rgb;
  }

  // Calculate diffuse lighting
  float diffuseFactor = max(0.0, dot(normalEye, toLightEye));
  vec3 diffuse = diffuseColor * textureAlbedo * diffuseFactor;

  // Calculate specular lighting
  float specularFactor = pow(max(0.0, dot(normalEye, halfEye)), shininess);
  vec3 specular = specularColor * specularFactor;

  // Calculate ambient lighting
  vec3 ambient = ambientFactor * textureAlbedo;

  // Combine lighting components
  fragmentColor = vec4(ambient + diffuse + specular, 1.0);
}