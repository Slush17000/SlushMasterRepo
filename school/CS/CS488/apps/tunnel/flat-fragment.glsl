in vec3 mixNormal;
out vec4 fragmentColor;
uniform vec3 colorParam;

void main() {
    vec3 n = normalize(mixNormal);
    fragmentColor =  vec4(colorParam * (n * 0.5 + .5), 1.0);
}
