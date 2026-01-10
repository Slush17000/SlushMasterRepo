// My project submissions:
void animatedBouncingCubesOverPlasma() {
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
}

void animatedInteractableSpinningTesseract() {
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
}

void animatedInteractableSpinningAtom() {
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
}

void animatedBallsPyramid() {
    // Animated Ball's Pyramid:
    // This shader doesn't do it justice, visit the following link for pictures of the real thing:
    // https://www.google.com/search?sca_esv=da5792c7619f0cb2&sxsrf=AE3TifP73LWJBRgzuuLuse9dD_rVxUEf5A:1759370796882&udm=2&fbs=AIIjpHxU7SXXniUZfeShr2fp4giZ1Y6MJ25_tmWITc7uy4KIemkjk18Cn72Gp24fGkjjh6xc8y8oU3IJovU34XDyOFvEbxWRMbrn584_vSQ1MOIomujmVmSTDvykTVp9ApZHG42idxhB2NDWcXpmmCqfCFRMIuDVgGU6dB6Q8qbLzvqEWXpx4h-6luGJLh5NzXxCpM_ym5WAqkhatT7aWfvc2XhWr8q4iw&q=balls+pyramid&sa=X&ved=2ahUKEwi2kYH7toSQAxXCFFkFHRMAGWkQtKgLegQIDRAB&biw=958&bih=910&dpr=1
    
    vec2 uv = (gl_FragCoord.xy / dimensions.xy) * 2.0 - 1.0;
    uv.x *= dimensions.x / dimensions.y;

    // Camera and sun setup
    vec3 rayOrigin = vec3(0.0, 1.5, -4.0);
    vec3 rayDirection = normalize(vec3(uv, 1.5));
    vec3 sunDir = normalize(vec3(0.8, 0.5, -1.0));

    // Rock parameters
    float rockBaseHeight = 0.6, rockHeight = 3.0, rockRadius = 0.5, spikeStrength = rockRadius * 0.35;

    // Sunset gradient
    vec3 skyBottom = vec3(1.0, 0.8, 0.5);
    vec3 skyMiddle = vec3(0.6, 0.2, 0.7);
    vec3 skyTop = vec3(0.1, 0.1, 0.4);
    float gradientFactor = clamp((uv.y + 1.0) * 0.5 * 2.0 - 1.0, 0.0, 1.0);
    vec3 skyColor = (gradientFactor < 0.5) ? mix(skyBottom, skyMiddle, gradientFactor * 2.0) : mix(skyMiddle, skyTop, (gradientFactor - 0.5) * 2.0);

    // Ray distance evaluation loop
    vec3 col = vec3(0.0);
    float travel = 0.0;
    for(int i = 0; i < 64; i++) {
        vec3 pos = rayOrigin + rayDirection * travel;
        float horizontalDist = length(pos.xz);

        // Rock
        float coneDist = horizontalDist - rockRadius * (1.0 - (pos.y - rockBaseHeight) / rockHeight);
        float edgeFalloff = smoothstep(0.0, rockRadius * 0.9, horizontalDist);
        float spikeFactor = 1.0 - pow(smoothstep(0.0, rockHeight, pos.y - rockBaseHeight), 2.0);
        float jaggedness = clamp(spikeStrength * edgeFalloff * spikeFactor * (abs(sin(pos.x * 3.0 + pos.z * 2.5)) * 0.6 +
            abs(cos(pos.z * 4.0 - pos.x * 3.5)) * 0.4 +
            0.25 * sin((pos.x + pos.z) * 2.0)) - 0.1, -0.08, 0.08);
        float rockVal = coneDist + jaggedness;

        // Ocean
        float oceanHeight = sin(pos.x * 0.5 + time) * 0.08 + cos(pos.z * 0.5 + time * 0.8) * 0.08;
        float oceanVal = pos.y - oceanHeight;
        float minDist = min(rockVal, oceanVal);

        // Surface shading
        if(minDist < 0.001) {
            if(rockVal < oceanVal) {
                float offset = 0.01;
                vec3 normal = normalize(vec3((length(vec3(pos.x + offset, pos.y, pos.z)) - horizontalDist) - (length(vec3(pos.x - offset, pos.y, pos.z)) - horizontalDist), offset, (length(vec3(pos.x, pos.y, pos.z + offset)) - horizontalDist) - (length(vec3(pos.x, pos.y, pos.z - offset)) - horizontalDist)));
                col = vec3(0.12) + clamp(dot(normal, sunDir), 0.0, 1.0) * 0.06;
            } else {
                float fade = exp(-length(pos.xz) * 0.2);
                float foam = clamp(smoothstep(0.06, 0.16, abs(pos.y - oceanHeight)) * fade * 0.5 + 0.01 * sin(pos.x * 10.0 + pos.z * 12.0 + time * 2.5), 0.0, 1.0);
                col = mix(vec3(0.0, 0.05, 0.2) + foam, skyColor, smoothstep(-0.05, 0.05, uv.y));
            }
            break;
        }

        travel += max(minDist, mix(0.0001, 0.5, clamp(travel / 20.0, 0.0, 1.0)));
        if(travel > 20.0) {
            col = (uv.y < 0.0) ? vec3(0.0, 0.05, 0.2) : skyColor;
            break;
        }
    }

    vec3 color = col;
}

// Example fragment shaders:
// Made by me:
void gradient1() {
    vec2 uv = gl_FragCoord.xy / dimensions;
    vec3 color = vec3(uv.x, uv.y, 1.0);
}

void interactiveRadialSpotlight() {
    vec2 uv = gl_FragCoord.xy / dimensions;
    vec2 mouseUV = vec2(mouse.x, dimensions.y - mouse.y) / dimensions;
    float d = distance(uv, mouseUV);
    float radius = 0.18;
    float soft = 0.06;
    float t = smoothstep(radius + soft, radius - soft, d);
    vec3 bg = vec3(0.04, 0.06, 0.12);
    vec3 light = vec3(1.0, 0.9, 0.65);
    vec3 color = mix(bg, light, t);
}

void metaballs() {
    vec2 p = gl_FragCoord.xy;
    float scale = min(dimensions.x, dimensions.y);
    vec2 centerA = vec2(dimensions.x * 0.3, dimensions.y * 0.5);
    vec2 centerB = vec2(dimensions.x * 0.7, dimensions.y * 0.45);
    vec2 centerM = vec2(mouse.x, dimensions.y - mouse.y);
    float rA = scale * 0.08;
    float rB = scale * 0.06;
    float rM = scale * (0.05 + 0.02 * sin(time * 2.0));
    floatpixelVal = rA * rA / (distance(p, centerA) * distance(p, centerA) + 1.0) + rB * rB / (distance(p, centerB) * distance(p, centerB) + 1.0) + rM * rM / (distance(p, centerM) * distance(p, centerM) + 1.0);
    float iso = 0.8;
    float mask = smoothstep(iso - 0.05, iso + 0.05, v);
    vec3 base = vec3(0.02, 0.02, 0.06);
    vec3 glow = vec3(0.2, 0.8, 1.0);
    vec3 color = mix(base, glow, mask);
}

void interactiveWaterRipple() {
    vec2 p = gl_FragCoord.xy;
    vec2 center = vec2(mouse.x, dimensions.y - mouse.y);
    float dist = distance(p, center);
    float wave = sin(dist * 0.06 - time * 6.0);
    float decay = 1.0 / (1.0 + dist * 0.02);
    float mask = smoothstep(0.0, 1.0, (0.5 + 0.5 * wave) * decay);
    vec3 base = vec3(0.02, 0.06, 0.12);
    vec3 highlight = vec3(0.5, 0.8, 1.0);
    vec3 color = mix(base, highlight, mask);
}

// Made by classmates:
void gradient2() {
    vec2 uv = gl_FragCoord.xy / dimensions;
    vec3 color1 = vec3(0.2, 0.4, 1.0);
    vec3 color2 = vec3(0.5, 0.0, 1.0);
    vec3 color3 = vec3(1.0, 0.6, 0.2);
    vec3 color4 = vec3(0.0, 1.0, 0.5);
    vec3 mix1 = mix(color1, color2, uv.y);
    vec3 mix2 = mix(color3, color4, uv.x);
    vec3 color = mix(mix1, mix2, 0.5 + 0.5 * sin(uv.x * 10.0 + uv.y * 5.0));
}

void rainbow() {
    vec2 uv = gl_FragCoord.xy / dimensions.xy;
    vec2 center = vec2(0.5, 0.0);
    float r = length(uv - center);
    float thickness = 0.1;
    float red = step(0.6, r) - step(0.62, r);
    float orange = step(0.62, r) - step(0.64, r);
    float yellow = step(0.64, r) - step(0.66, r);
    float green = step(0.66, r) - step(0.68, r);
    float blue = step(0.68, r) - step(0.70, r);
    float violet = step(0.70, r) - step(0.72, r);
    vec3 rainbow = red * vec3(1.0, 0.0, 0.0) + orange * vec3(1.0, 0.5, 0.0) + yellow * vec3(1.0, 1.0, 0.0) + green * vec3(0.0, 1.0, 0.0) + blue * vec3(0.0, 0.0, 1.0) + violet * vec3(0.5, 0.0, 1.0);
    vec3 background = vec3(0.2, 0.4, 1.0);
    vec3 color = mix(background, rainbow, red + orange + yellow + green + blue + violet);
}

void chessBoard() {
    vec2 coords = gl_FragCoord.xy / dimensions;
    vec2 ij = floor(coords * 8.0);
    vec3 lightWood = vec3(0.76, 0.60, 0.42);
    vec3 darkWood = vec3(0.45, 0.30, 0.18);
    float parity = mod(ij.x + ij.y, 2.0);
    vec3 base = mix(lightWood, darkWood, parity);
    vec3 color = mix(base * 0.9, base * 1.4, fract(coords * 8.0).y * 0.7 + fract(coords * 8.0).x * 0.3);
}

void telescope() {
    vec2 current = gl_FragCoord.xy;
    vec2 mouseGL = vec2(mouse.x, dimensions.y - mouse.y);
    float outerRadius = 120.0;
    float zoom = 3.0;
    float d = distance(current, mouseGL);
    vec2 samplePos = mouseGL + (current - mouseGL) / zoom;
    float starSpacing = 50.0;
    float pulse = 0.7 + 0.5 * sin(time * 2.0);
    samplePos.y += fract(sin(floor(samplePos.x / starSpacing) * 43758.5453)) * starSpacing;
    vec2 uvSample = mod(samplePos, starSpacing);
    float starSample = step(length(uvSample - starSpacing * 0.5), 2.0) * pulse;
    vec3 sampled = vec3(starSample);
    float mask = 1.0 - step(outerRadius, d);
    vec3 color = mix(vec3(0.3), sampled, mask);
    float ring = smoothstep(outerRadius - 1.5, outerRadius, d) - smoothstep(outerRadius, outerRadius + 1.5, d);
    color += vec3(1.0) * ring;
}

void amogus() {
    float x = gl_FragCoord.x / dimensions.x;
    float y = gl_FragCoord.y / dimensions.y;
    float msx = mouse.x / dimensions.x;
    float msy = 1.0 - mouse.y / dimensions.y;
    vec3 color = vec3(0.0);
    vec3 unred = vec3(0.0, -1.0, -1.0);
    vec3 unblue = vec3(-1.0, -1.0, 0.0);
    vec3 uncyan = vec3(-1.0, 0.0, 0.0);
    float dx = 1.0 - mod(time / 10.0 + 9.0, 2.0);
    float ax = x + dx;
    if(y < .025 && 0.2 < ax && ax < 0.21) {
        color = unred;
    } else if(y < .025 && 0.225 < ax && ax < 0.235) {
        color = unred;
    } else if(.025 < y && y < .1 && 0.2 < ax && ax < 0.235) {
        color = unred;
    }
    float ox = 0.2175;
    float oy = 0.1;
    float r = 0.0175;
    if(y >= .1 && (ax - ox) * (ax - ox) + (y - oy) * (y - oy) < r * r) {
        color = unred;
    }
    ox = .225;
    oy = .08;
    if((ax - ox) * (ax - ox) + (y - oy) * (y - oy) < r * r) {
        color = unblue;
    }
    r *= .9;
    if((ax - ox) * (ax - ox) + (y - oy) * (y - oy) < r * r) {
        color = uncyan;
    }
    if(0.025 < y && y < 0.09 && 0.19 < ax && ax < 0.2) {
        color = unred;
    }
    float dist = sqrt((msx - x) * (msx - x) + (msy - y) * (msy - y));
    if(dist < .1) {
        color += mod(3.0 - dist * 10.0, 2.0);
    }
}

void rainbowWaveOverGradient() {
    vec2 coords = gl_FragCoord.xy / dimensions;
    float wave = 0.5 + 0.12 * sin(coords.x * 6.2831853 + time * 2.0);
    float mask = step(abs(coords.y - wave), 0.01);
    vec3 bg = mix(vec3(0.05, 0.15, 0.45), vec3(0.00, 0.60, 0.70), coords.x);
    float hue = fract(coords.x + time * 0.25 + wave * 0.5);
    vec3 rainbow = clamp(abs(fract(hue + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
    vec3 color = mix(bg, rainbow, mask);
}

void sunCycle() {
    vec2 coords = gl_FragCoord.xy / dimensions;
    float t = mod(time, 4.0) / 4.0;
    float pi = 3.14159265;
    vec3 dayColor = vec3(0.5, 0.7, 1.0);
    vec3 nightColor = vec3(0.0, 0.0, 0.2);
    float cycle = sin(t * pi);
    vec3 color = mix(nightColor, dayColor, cycle);
    float circleRadius = 0.06;
    float x = mix(-circleRadius, 1.0 + circleRadius, t);
    float arc = 0.25 + 0.45 * cycle;
    vec2 center = vec2(x, arc);
    float d = length(coords - center);
    float edgeWidth = 0.1;
    float mask = 1.0 - smoothstep(circleRadius, circleRadius + edgeWidth, d);
    vec3 circleColor = vec3(1.0, 0.9, 0.4);
    color = mix(color, circleColor, mask);
}

void coloredSquares() {
    vec3 color = vec3(0, 0, 0);
    float diameter = dimensions.x / 16.0;
    for(float h = 0.0; h < 16.0; h++) {
        for(float k = 0.0; k < 16.0; k++) {
            vec2 square = vec2(h * diameter + diameter / 2.0, k * diameter + diameter / 2.0);
            vec2 dist = gl_FragCoord.xy - square.xy + 10.0;
            if(dist.x > 0.0 && dist.x < diameter && dist.y > 0.0 && dist.y < diameter) {
                if(dist.x > 20.0 || dist.y > 20.0) {
                    color = vec3(0, 0, 0);
                } else {
                    color = vec3(sin(mouse.x * (h + 1.0)), cos(mouse.y * (k + 1.0)), cos(mouse.x + mouse.y));
                }
            }
        }
    }
}

void coloredCircles() {
    vec3 color = vec3(0, 0, 0);
    float circleRadius = dimensions.x / 16.0;
    for(float h = 0.0; h < 8.0; h++) {
        for(float k = 0.0; k < 8.0; k++) {
            vec2 center = vec2((h + 0.5) * circleRadius * 2.0, (k + 0.5) * circleRadius * 2.0);
            float dist = length(gl_FragCoord.xy - center);
            float normK = k / 7.0 * 2.0 * 3.14159;
            float normH = h / 7.0 * 2.0 * 3.14159;
            if(dist < circleRadius) {
                if(dist > 20.0) {
                    color = vec3(cos(normK), sin(normH), tan(normK + normH));
                } else {
                    color = vec3(sin(normH), cos(normK), tan(normK - normH));
                }
            }
        }
    }
}

void mouseSpirograph() {
    vec2 normalizedDim = gl_FragCoord.xy - dimensions * 0.5;
    float outerRadius = 1.0;
    float innerRadius = mouse.x / dimensions.x;
    float d = mouse.y / dimensions.y;
    vec3 color = vec3(0.12, 0.08, 0.08);
    for(float i = 0.0; i < 2000.0; i++) {
        float x = ((outerRadius - innerRadius) * cos(i) + d * cos((outerRadius - innerRadius) / innerRadius * i)) * dimensions.x * 0.5;
        float y = ((outerRadius - innerRadius) * sin(i) + d * sin((outerRadius - innerRadius) / innerRadius * i)) * dimensions.y * 0.5;
        if(length(vec2(x, y) - normalizedDim) <= 1.5) {
            color = vec3(cos(i), sin(i), i);
        }
    }
}

void dvdTypeScreensaver() {
    vec2 uv = gl_FragCoord.xy / dimensions.xy;
    float size = 60.0;
    vec2 velocity = vec2(300.0, 300.0);
    vec2 bounds = dimensions - size;
    vec2 pos = mod(abs(velocity * time), 2.0 * bounds);
    pos = mix(pos, 2.0 * bounds - pos, step(bounds, pos));
    vec2 bottomCorner = pos;
    vec2 topCorner = pos + size;
    bool inside = all(greaterThanEqual(gl_FragCoord.xy, bottomCorner)) &&
        all(lessThanEqual(gl_FragCoord.xy, topCorner));
    vec3 color = 1.0 + 5.0 * cos(uv.xyx + vec3(1, 1, 4));
    color = inside ? color : vec3(0.0, 0.0, 0.0);
}
