uniform vec2 dimensions;
uniform float time;

out vec4 fragmentColor;

vec3 animatedBouncingCubesOverPlasma() {
    // Animated bouncing cubes over plasma background:
    
    // Normalized screen UV
    vec2 uv = gl_FragCoord.xy / dimensions.xy;
    float aspectRatio = dimensions.x / dimensions.y;

    // Plasma background
    float plasmaVal = sin((uv.x + time * 0.6) * 10.0) + sin((uv.y - time * 0.8) * 8.0) + sin((uv.x + uv.y + sin(time)) * 6.0);
    plasmaVal *= 0.3333;
    vec3 color = vec3(0.5 + 0.5 * sin(3.0 * plasmaVal + 2.0), 0.0, 0.7 + 0.3 * sin(3.0 * plasmaVal));

    // Cube settings
    float edgeThickness = 0.003;
    float rotYAng = -0.5, rotXAng = 0.2;
    mat2 rotYMat = mat2(cos(rotYAng), -sin(rotYAng), sin(rotYAng), cos(rotYAng));

    // Define cube edges (pairs of vertex indices) and generate cubes
    int cubeEdges[24] = int[24](0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7);
    const int NUM_CUBES = 4;
    vec3 prevCubeSize = vec3(0.5), prevCubePos = vec3(0.0);

    for(int cubeIndex = 0; cubeIndex < NUM_CUBES; cubeIndex++) {
        // Determine cube size and position
        vec3 currCubeSize = prevCubeSize * (cubeIndex == 0 ? 1.0 : 0.5);
        vec3 currCubePos = prevCubePos;

        // Move only the inner cubes
        if(cubeIndex > 0) {
            vec3 cubeSpeed = vec3(0.8, 0.6, 0.4);
            vec3 minBound = prevCubePos - prevCubeSize * 0.9 + currCubeSize;
            vec3 maxBound = prevCubePos + prevCubeSize * 0.9 - currCubeSize;
            currCubePos = mod(cubeSpeed * time, 2.0 * (maxBound - minBound)) + minBound;
            currCubePos = mix(currCubePos, 2.0 * maxBound - currCubePos, step(maxBound, currCubePos));
            currCubePos = mix(currCubePos, 2.0 * minBound - currCubePos, step(currCubePos, minBound));
        }

        // Build cube vertices
        vec3 cubeVerts[8];
        cubeVerts[0] = currCubePos + vec3(-currCubeSize.x, -currCubeSize.y, -currCubeSize.z);
        cubeVerts[1] = currCubePos + vec3(currCubeSize.x, -currCubeSize.y, -currCubeSize.z);
        cubeVerts[2] = currCubePos + vec3(currCubeSize.x, currCubeSize.y, -currCubeSize.z);
        cubeVerts[3] = currCubePos + vec3(-currCubeSize.x, currCubeSize.y, -currCubeSize.z);
        cubeVerts[4] = currCubePos + vec3(-currCubeSize.x, -currCubeSize.y, currCubeSize.z);
        cubeVerts[5] = currCubePos + vec3(currCubeSize.x, -currCubeSize.y, currCubeSize.z);
        cubeVerts[6] = currCubePos + vec3(currCubeSize.x, currCubeSize.y, currCubeSize.z);
        cubeVerts[7] = currCubePos + vec3(-currCubeSize.x, currCubeSize.y, currCubeSize.z);

        // Rotate cube vertices
        for(int v = 0; v < 8; v++) {
            cubeVerts[v].xz = rotYMat * cubeVerts[v].xz;
            float y = cubeVerts[v].y, z = cubeVerts[v].z;
            cubeVerts[v].y = cos(rotXAng) * y - sin(rotXAng) * z;
            cubeVerts[v].z = sin(rotXAng) * y + cos(rotXAng) * z;
        }

        // Project vertices to screen with aspect ratio
        vec2 screenVerts[8];
        for(int v = 0; v < 8; v++) screenVerts[v] = vec2((cubeVerts[v].x / aspectRatio + 1.0) * 0.5 * dimensions.x, (cubeVerts[v].y + 1.0) * 0.5 * dimensions.y);

        // Draw cube edges
        float cubeEdgeMask = 0.0;
        for(int e = 0; e < 12; e++) {
            int edgeIndex = e * 2;
            vec2 start = screenVerts[cubeEdges[edgeIndex]], end = screenVerts[cubeEdges[edgeIndex + 1]];
            vec2 pixelToStart = gl_FragCoord.xy - start;
            vec2 edgeVec = end - start;
            float normDist = clamp(dot(pixelToStart, edgeVec) / dot(edgeVec, edgeVec), 0.0, 1.0);
            float distToEdge = length(pixelToStart - edgeVec * normDist);
            cubeEdgeMask += smoothstep(edgeThickness * dimensions.x, 0.0, distToEdge);
        }

        color = mix(color, vec3(0.0), clamp(cubeEdgeMask, 0.0, 1.0));

        // Save for the next cube
        prevCubeSize = currCubeSize;
        prevCubePos = currCubePos;
    }

  return color;
}

void main() {
  vec3 color = animatedBouncingCubesOverPlasma();
  fragmentColor = vec4(color, 1.0);
}
