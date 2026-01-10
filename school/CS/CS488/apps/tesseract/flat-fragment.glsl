uniform vec2 dimensions;
uniform vec2 mouse;
uniform float time;

out vec4 fragmentColor;

vec3 animatedInteractableSpinningTesseract() {
  // Animated interactable spinning tesseract:
    
  vec3 color = vec3(0.0);
  float aspectRatio = dimensions.x / dimensions.y;

  // Mouse-driven rotation (yaw = left/right, pitch = up/down)
  float yaw = (mouse.x / dimensions.x - 0.5) * 6.2831;
  float pitch = (mouse.y / dimensions.y - 0.5) * 3.1415;

  // XY-rotation matrices
  mat3 rotationYMouse = mat3(cos(yaw), 0, sin(yaw), 0, 1, 0, -sin(yaw), 0, cos(yaw));
  mat3 rotationXMouse = mat3(1, 0, 0, 0, cos(pitch), -sin(pitch), 0, sin(pitch), cos(pitch));

  // Build 4D tesseract vertices
  vec4 tesseractVerts4D[16];
  int vertIndex = 0;
  for(int x = -1; x <= 1; x += 2) {
    for(int y = -1; y <= 1; y += 2) {
      for(int z = -1; z <= 1; z += 2) {
        for(int w = -1; w <= 1; w += 2) {
          tesseractVerts4D[vertIndex++] = vec4(float(x), float(y), float(z), float(w));
        }
      }
    }
  }

  // Project 4D to 3D (w as perspective) and apply mouse rotation
  vec3 tesseractVerts3D[16];
  for(int i = 0; i < 16; i++) {
    float w = tesseractVerts4D[i].w;
    float perspectiveScale = 1.0 / (2.0 - w);
    tesseractVerts3D[i] = rotationXMouse * (rotationYMouse * (tesseractVerts4D[i].xyz * perspectiveScale));
  }

  // Project 3D to 2D screen with aspect ratio
  vec2 tesseractVerts2D[16];
  for(int i = 0; i < 16; i++) tesseractVerts2D[i] = vec2((tesseractVerts3D[i].x / aspectRatio * 0.3 + 0.5) * dimensions.x, (tesseractVerts3D[i].y * 0.3 + 0.5) * dimensions.y);

  // Draw wireframe edges
  float edgeThickness = 2.0;
  float wireframeMask = 0.0;
  for(int i = 0; i < 16; i++) {
    for(int j = i + 1; j < 16; j++) {
      int diffCoords = 0;
      for(int k = 0; k < 4; k++) if(tesseractVerts4D[i][k] != tesseractVerts4D[j][k])
        diffCoords++;
      if(diffCoords == 1) {
        vec2 start = tesseractVerts2D[i];
        vec2 end = tesseractVerts2D[j];
        vec2 pixelToStart = gl_FragCoord.xy - start;
        vec2 edgeVec = end - start;
        float normDist = clamp(dot(pixelToStart, edgeVec) / dot(edgeVec, edgeVec), 0.0, 1.0);
        float distToEdge = length(pixelToStart - edgeVec * normDist);
        wireframeMask += smoothstep(edgeThickness, 0.0, distToEdge);
      }
    }
  }

  color += vec3(wireframeMask);

  // Inner cube animated glow
  vec2 screenCenter = dimensions * 0.5;
  float distToCenter = length(gl_FragCoord.xy - screenCenter);
  float glow = exp(-0.00005 * distToCenter * distToCenter);
  vec3 glowColors[4] = vec3[4](vec3(0.0, 1.0, 0.62), vec3(0.07, 0.0, 1.0), vec3(0.6, 0.0, 1.0), vec3(1.0, 0.0, 0.0));

  // Animate glow color over time
  float cycle = mod(time * 0.2, 4.0);
  vec3 animatedGlow;
  if(cycle < 1.0)
    animatedGlow = mix(glowColors[0], glowColors[1], cycle);
  else if(cycle < 2.0)
    animatedGlow = mix(glowColors[1], glowColors[2], cycle - 1.0);
  else if(cycle < 3.0)
    animatedGlow = mix(glowColors[2], glowColors[3], cycle - 2.0);
  else
    animatedGlow = mix(glowColors[3], glowColors[0], cycle - 3.0);

  color += animatedGlow * glow * 1.5;
  return color;
}

void main() {
  vec3 color = animatedInteractableSpinningTesseract();
  fragmentColor = vec4(color, 1.0);
}
