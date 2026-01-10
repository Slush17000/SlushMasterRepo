precision mediump float;

uniform vec3 albedo;
uniform vec3 lightPositionEye;
uniform float ambientFactor;
uniform float shininess;
uniform float alpha;
uniform vec3 diffuseColor;
uniform vec3 specularColor;

in vec3 mixNormalEye;
in vec3 mixPositionEye;

out vec4 fragmentColor;

void main() {
  // Use flat shading - compute normal from face (negated for correct orientation)
  vec3 normalEye = -normalize(cross(dFdx(mixPositionEye), dFdy(mixPositionEye)));
  
  vec3 toLightEye = normalize(lightPositionEye - mixPositionEye);
  float diffuseFactor = max(0.0, dot(normalEye, toLightEye));
  
  vec3 toEyeEye = normalize(-mixPositionEye);
  vec3 halfEye = normalize(toLightEye + toEyeEye);
  float specularFactor = pow(max(0.0, dot(normalEye, halfEye)), shininess);
  
  vec3 litness = ambientFactor * albedo + diffuseFactor * diffuseColor + specularFactor * specularColor;
  
  fragmentColor = vec4(litness, alpha);
}
