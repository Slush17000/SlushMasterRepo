in vec3 mixNormal;
out vec4 fragmentColor;

void main() {
    vec3 n = normalize(mixNormal);
    fragmentColor = vec4(n, 1.0);

}