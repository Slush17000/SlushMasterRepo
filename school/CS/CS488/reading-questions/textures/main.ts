let canvas: HTMLCanvasElement;

const logDiv = document.getElementById('log')!;
const originalLog = console.log;

console.log = (...args: any[]) => {
    originalLog.apply(console, args);
    logDiv.textContent += args.join(' ') + "\n";
};

async function initialize() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

    // Texture questions:
    console.log(`1. Texturing must have some costs, even if it's cheaper than adding triangles. Which performance costs may be attributed to texturing?`);
    console.log(`   VRAM is consumed and the shader takes a bit more time to execute.\n`);

    console.log(`2. Consult the documentation of Promise.all and await. What happens if we call Promise.all with an array of fetches to invalid URLs?`);
    console.log(`   A single exception is thrown.\n`);

    console.log(`3. How many texture units are supported by your browser and graphics card?`);
    const unitCount = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    console.log(`   ${unitCount}\n`);

    console.log(`4. Function texImage2D has many parameters. Match each parameter description to its position in the parameter list. Example call: gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, image);`);
    console.log(`   0 - the target or mode of the texture`);
    console.log(`   1 - the detail level, which is 0 for the full-resolution version and higher for lower-resolution versions`);
    console.log(`   2 - the tuple type of each pixel in the uploaded texture object`);
    console.log(`   3 - the number of columns in the texture`);
    console.log(`   4 - the number of rows in the texture`);
    console.log(`   5 - the size of the border, which must always be 0 in WebGL`);
    console.log(`   6 - the tuple type of each pixel in the buffer to upload`);
    console.log(`   7 - the data type of each component in the buffer to upload`);
    console.log(`   8 - the collection of pixel values\n`);

    console.log(`5. If you have six textures, which unit is a likely choice to manage the last texture?`);
    console.log(`   gl.TEXTURE5\n`);

    console.log(`6. Suppose you have texture coordinate pair [0.5, 0.75]. Unitless proportions are flexible because they can be applied to textures of many possible resolutions. To what column and row indices do they correspond for textures of the following resolutions?`);
    console.log(`   1024x2048 - [512, 1536]`);
    console.log(`   256x512 - [128, 384]`);
    console.log(`   4x8 - [2, 6]\n`);

    console.log(`7. Suppose we have this assignment in a shader:\n\nvec4 color = vec4(0.4, 0.5, 0.6, 0.2);\n\nWhat swizzling expressions produce the following values?`);
    console.log(`   vec2(0.6, 0.4) - color.br`);
    console.log(`   0.2 - color.a`);
    console.log(`   vec3(0.2, 0.4, 0.5) - color.arg`);
    console.log(`   vec3(0.4, 0.4, 0.4) - color.rrr`);
    console.log(`   vec4(0.5, 0.2, 0.5, 0.2) - color.gaga\n`);

    console.log(`8. Each corner of the crate is home to three vertices. Which properties of these vertices are the same?`);
    console.log(`   position\n`);

    console.log(`9. Wrap the following coordinates so the texture repeats.`);
    console.log(`   1.09 -> 1.09 - floor(1.09) = 1.09 - 1 = 0.09`);
    console.log(`   -3.28 -> -3.28 - floor(-3.28) = -3.28 - (-4) = 0.72`);
    console.log(`   25.43 -> 25.43 - floor(25.43) = 25.43 - 25 = 0.43`);
    console.log(`   -0.92 -> -0.92 - floor(-0.92) = -0.92 - (-1) = 0.08`);
    console.log(`   0.6 -> 0.6 - floor(0.6) = 0.6 - 0 = 0.6\n`);

    console.log(`10. Wrap the following coordinates so the texture is clamped.`);
    console.log(`    1.09 -> min(1, max(0, 1.09)) = min(1, 1.09) = 1`);
    console.log(`   -3.28 -> min(1, max(0, -3.28)) = min(1, 0) = 0`);
    console.log(`    25.43 -> min(1, max(0, 25.43)) = min(1, 1) = 1`);
    console.log(`   -0.92 -> min(1, max(0, -0.92)) = min(1, 0) = 0`);
    console.log(`    0.6 -> min(1, max(0, 0.6)) = min(1, 0.6) = 0.6\n`);

    console.log(`11. What are the binary and decimal values of the following expressions?`);
    console.log(`    5 (decimal) << 1 = 101 (binary) << 1 -> 1010 (binary) = 10 (decimal)`);
    console.log(`    5 (decimal) << 2 = 101 (binary) << 2 -> 10100 (binary) = 20 (decimal)`);
    console.log(`    5 (decimal) << 3 = 101 (binary) << 3 -> 101000 (binary) = 40 (decimal)`);
    console.log(`    5 (decimal) << 4 = 101 (binary) << 4 -> 1010000 (binary) = 80 (decimal)\n`);

    console.log(`12. What are the binary values of the following mask operations?`);
    console.log(`    43 & 1 (binary) = 101011 & 000001 = 000001 (binary)`);
    console.log(`    43 & 11 (binary) = 101011 & 000011 = 000011 (binary)`);
    console.log(`    43 & 111 (binary) = 101011 & 000111 = 000011 (binary)`);
    console.log(`    43 & 1111 (binary) = 101011 & 001111 = 001011 (binary)`);
    console.log(`    43 & 11111 (binary) = 101011 & 011111 = 001011 (binary)`);
    console.log(`    43 & 111111 (binary) = 101011 & 111111 = 101011 (binary)\n`);

    console.log(`13. What are the power-of-2 ceilings of the following numbers?`);
    console.log(`    600 -> 1024`);
    console.log(`    199 -> 256`);
    console.log(`    16 -> 16`);
    console.log(`    1025 -> 2048`);
    console.log(`    82 -> 128\n`);

    console.log(`14. Suppose a texture is 128x256 and is applied to a rectangle. For which resolutions of the rectangle will the texture be magnified?`);
    console.log(`    50x300`);
    console.log(`    300x400\n`);

    console.log(`15. How many levels will textures of the following resolutions have in their mipmap pyramid?`);
    console.log(`    128x128 -> 8 levels`);
    console.log(`    1024x1024 -> 11 levels`);
    console.log(`    32x16 -> 6 levels\n`);

    console.log(`16. A texture has the following configuration:\n\ngl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);\ngl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);\n\nTo what coordinates do the texture coordinates (1.25, 3.6) wrap?`);
    console.log(`    s = 1.25 - floor(1.25) = 1.25 - 1 = 0.25`);
    console.log(`    t = 3.6 - floor(3.6) = 3.6 - 3 = 0.6\n`);

    console.log(`17. What is a texture unit?`);
    console.log(`    The hardware on a graphics card that performs texel lookups.\n`);

    console.log(`18. Complete the following TypeScript code so that the single vertex is associated with the texel at the center of the texture's top edge.`);
    console.log(`    const positions = [0, 0, 0];\n    const texPositions = [0.5, 1];\n`);

    console.log(`19. What is the power-of-2 ceiling of 7509?`);
    console.log(`    8192\n`);

    console.log(`20. Which of the following are true of texture coordinates?`);
    console.log(`    They are expressed as proportions so they may be freely applied to different resolutions of a texture and they indicate locations along the s-axis and t-axis of texture space.\n`);

    console.log(`21. A texture has resolution 4096x1024. How many levels are in its mipmap pyramid?`);
    console.log(`    13 levels\n`);

    console.log(`22. Which is a weakness of linear interpolation?`);
    console.log(`    Blurriness\n`);

    console.log(`23. A circle has radius 12 at time 45. The radius drops linearly to 0 at time 90. What is its radius at time 60?`);
    console.log(`    8\n`);


    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());

    resizeCanvas();
}

function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

function transposeMatrix4(elements: ArrayLike<number>): number[] {
    const t = new Array(16);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            t[c * 4 + r] = elements[r * 4 + c];
        }
    }
    return t;
}

window.addEventListener('load', () => initialize());