uniform vec2 dimensions;
uniform float time;

out vec4 fragmentColor;

vec3 animatedBallsPyramid() {
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
    return color;
}

void main() {
    vec3 color = animatedBallsPyramid();
    fragmentColor = vec4(color, 1.0);
}
