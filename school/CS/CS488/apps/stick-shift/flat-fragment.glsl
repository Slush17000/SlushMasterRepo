in vec3 mixNormal;
out vec4 fragmentColor;

void main() {
    vec3 n = mixNormal;
    fragmentColor = vec4((n * 0.5 + 0.5), 1.0);
}