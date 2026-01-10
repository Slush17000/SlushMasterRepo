uniform sampler2D imageTexture;

in vec2 mixTexPosition;

out vec4 fragmentColor;

void main() {
  fragmentColor = texture(imageTexture, mixTexPosition);
}
