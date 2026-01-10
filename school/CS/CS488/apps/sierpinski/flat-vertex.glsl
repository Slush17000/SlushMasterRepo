uniform float aspectRatio;

in vec3 position;

void main() {
  vec3 adjustedPosition = position;
  
  // Scale x coordinate based on aspect ratio to maintain square appearance
  if (aspectRatio > 1.0) {
    // Width > height, scale down x
    adjustedPosition.x = position.x / aspectRatio;
  } else {
    // Height > width, scale up y
    adjustedPosition.y = position.y * aspectRatio;
  }
  
  gl_Position = vec4(adjustedPosition, 1.0);
}
