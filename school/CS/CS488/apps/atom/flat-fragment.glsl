uniform vec2 dimensions;
uniform vec2 mouse;
uniform float time;

out vec4 fragmentColor;

vec3 animatedInteractableSpinningAtom() {
  // Animated interactable spinning atom:
    
  vec3 color = vec3(0.0);
  vec2 screenCenter = dimensions * 0.5;
  float focalLength = 800.0;

  // Orbit setup
  const int NUM_ORBITS = 4;
  float baseRadius = 1.3;
  float tiltAngles[NUM_ORBITS];
  tiltAngles[0] = 0.4;
  tiltAngles[1] = 1.2;
  tiltAngles[2] = 2.0;
  tiltAngles[3] = 2.8;

  // Mouse rotation
  float yaw = (mouse.x / dimensions.x - 0.5) * 6.2831;
  float pitch = (mouse.y / dimensions.y - 0.5) * 3.1415;
  mat3 rotationYMouse = mat3(cos(yaw), 0, sin(yaw), 0, 1, 0, -sin(yaw), 0, cos(yaw));
  mat3 rotationXMouse = mat3(1, 0, 0, 0, cos(pitch), -sin(pitch), 0, sin(pitch), cos(pitch));
  float zOffset = 3.0;

  // Draw orbits
  for(int orbitIndex = 0; orbitIndex < NUM_ORBITS; orbitIndex++) {
    float tilt = tiltAngles[orbitIndex];
    mat3 rotationXOrbit = mat3(1, 0, 0, 0, cos(tilt), -sin(tilt), 0, sin(tilt), cos(tilt));
    vec2 pixelRel = gl_FragCoord.xy - screenCenter;
    float closestDist = 1e20;
    for(int s = 0; s < 128; s++) {
      float angle = 6.2831853 * float(s) / 128.0;
      vec3 orbitPoint = rotationXOrbit * vec3(cos(angle) * baseRadius, sin(angle) * baseRadius, 0.0);
      orbitPoint = rotationXMouse * (rotationYMouse * orbitPoint);
      vec2 screenPos = vec2(orbitPoint.x * focalLength / max(0.001, orbitPoint.z + zOffset), orbitPoint.y * focalLength / max(0.001, orbitPoint.z + zOffset));
      closestDist = min(closestDist, length(pixelRel - screenPos));
    }
    color += vec3(1.0) * (1.0 - smoothstep(0.0, 3.0, closestDist));
  }

  // Draw electrons
  vec3 electronColor = vec3(1.0, 1.0, 0.0);
  for(int e = 0; e < NUM_ORBITS; e++) {
    float tilt = tiltAngles[e];
    mat3 rotationXOrbit = mat3(1, 0, 0, 0, cos(tilt), -sin(tilt), 0, sin(tilt), cos(tilt));
    float angle = time * 2.0 + float(e) * 2.0;
    vec3 elecPos = rotationXOrbit * vec3(cos(angle) * baseRadius, sin(angle) * baseRadius, 0.0);
    elecPos = rotationXMouse * (rotationYMouse * elecPos);
    float zProj = max(0.001, elecPos.z + zOffset);
    vec2 screenPos = screenCenter + vec2(elecPos.x * focalLength / zProj, elecPos.y * focalLength / zProj);
    float dist = length(gl_FragCoord.xy - screenPos);
    color += electronColor * exp(-0.5 * (dist * dist) / (6.0 * 6.0)) * clamp(1.0 / zProj * 1.5, 0.5, 2.0) * 2.0;
  }

  // Draw nucleus (protons and neutrons)
  const int NUM_PROTONS = 8, NUM_NEUTRONS = 8;
  float clusterRadius = 0.1;
  float nucleusGlow = 12.0;

  for(int i = 0; i < NUM_PROTONS + NUM_NEUTRONS; i++) {
    float seed = float(i);
    vec3 nucPos = vec3(fract(sin(seed * 12.9898) * 43758.5453) * 2.0 - 1.0, fract(sin((seed + 1.0) * 78.233) * 43758.5453) * 2.0 - 1.0, fract(sin((seed + 2.0) * 39.425) * 43758.5453) * 2.0 - 1.0) * clusterRadius;
    nucPos = rotationXMouse * (rotationYMouse * nucPos);
    float zProj = max(0.001, nucPos.z + zOffset);
    vec2 screenPos = screenCenter + vec2(nucPos.x * focalLength / zProj, nucPos.y * focalLength / zProj);
    float dist = length(gl_FragCoord.xy - screenPos);
    float glow = exp(-0.5 * (dist * dist) / (nucleusGlow * nucleusGlow));
    if(i < NUM_PROTONS)
      color += vec3(1.0, 0.0, 0.0) * glow * 1.5;
    else
      color += vec3(0.0, 0.3, 1.0) * glow * 1.5;
  }
  
  return color;
}

void main() {
  vec3 color = animatedInteractableSpinningAtom();
  fragmentColor = vec4(color, 1.0);
}
