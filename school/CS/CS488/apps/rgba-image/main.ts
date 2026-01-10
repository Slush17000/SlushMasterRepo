import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Vector3 } from 'lib/vector.js';

let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let vao: VertexArray;
let texture: WebGLTexture;

const imageWidth = 256;
const imageHeight = 256;

// Procedural image generators
function generateColoredStatic(width: number, height: number): Uint8ClampedArray {
  const n = width * height * 4;
  const pixels = new Uint8ClampedArray(n);

  for (let r = 0; r < height; ++r) {
    for (let c = 0; c < width; ++c) {
      let i = (r * width + c) * 4;
      pixels[i + 0] = Math.random() * 255;
      pixels[i + 1] = Math.random() * 255;
      pixels[i + 2] = Math.random() * 255;
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

function generateStaticNoRed(width: number, height: number): Uint8ClampedArray {
  const n = width * height * 4;
  const pixels = new Uint8ClampedArray(n);

  for (let r = 0; r < height; ++r) {
    for (let c = 0; c < width; ++c) {
      let i = (r * width + c) * 4;
      pixels[i + 0] = 0;
      pixels[i + 1] = Math.random() * 255;
      pixels[i + 2] = Math.random() * 255;
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

function generateGrayscaleStatic(width: number, height: number): Uint8ClampedArray {
  const n = width * height * 4;
  const pixels = new Uint8ClampedArray(n);

  for (let r = 0; r < height; ++r) {
    for (let c = 0; c < width; ++c) {
      let i = (r * width + c) * 4;
      const gray = Math.random() * 255;
      pixels[i + 0] = gray;
      pixels[i + 1] = gray;
      pixels[i + 2] = gray;
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

function generateDistanceFromCenter(width: number, height: number): Uint8ClampedArray {
  const n = width * height * 4;
  const pixels = new Uint8ClampedArray(n);

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let r = 0; r < height; ++r) {
    for (let c = 0; c < width; ++c) {
      let i = (r * width + c) * 4;
      const dx = c - centerX;
      const dy = r - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalized = (distance / maxDistance) * 255;

      pixels[i + 0] = normalized;
      pixels[i + 1] = normalized;
      pixels[i + 2] = normalized;
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

function generateCheckerboard(width: number, height: number): Uint8ClampedArray {
  const n = width * height * 4;
  const pixels = new Uint8ClampedArray(n);

  const squareSize = 16;

  for (let r = 0; r < height; ++r) {
    for (let c = 0; c < width; ++c) {
      let i = (r * width + c) * 4;
      const squareRow = Math.floor(r / squareSize);
      const squareCol = Math.floor(c / squareSize);
      const isWhite = (squareRow + squareCol) % 2 === 0;
      const value = isWhite ? 255 : 0;

      pixels[i + 0] = value;
      pixels[i + 1] = value;
      pixels[i + 2] = value;
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

function generateXorPattern(width: number, height: number): Uint8ClampedArray {
  const n = width * height * 4;
  const pixels = new Uint8ClampedArray(n);

  for (let r = 0; r < height; ++r) {
    for (let c = 0; c < width; ++c) {
      let i = (r * width + c) * 4;
      const xorValue = r ^ c;

      pixels[i + 0] = xorValue;
      pixels[i + 1] = xorValue;
      pixels[i + 2] = xorValue;
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

function generateSinePattern(width: number, height: number): Uint8ClampedArray {
  const n = width * height * 4;
  const pixels = new Uint8ClampedArray(n);

  const frequency = 0.05;

  for (let r = 0; r < height; ++r) {
    for (let c = 0; c < width; ++c) {
      let i = (r * width + c) * 4;

      const sineX = Math.sin(c * frequency);
      const sineY = Math.sin(r * frequency);
      const combined = (sineX + sineY) / 2;
      const normalized = (combined + 1) / 2 * 255;

      pixels[i + 0] = normalized;
      pixels[i + 1] = normalized * 0.5;
      pixels[i + 2] = normalized * 0.8;
      pixels[i + 3] = 255;
    }
  }

  return pixels;
}

async function initialize() {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  // Create a quad that fills the screen
  const positions = new Float32Array([
    new Vector3(-1, -1, 0),  // bottom-left
    new Vector3(1, -1, 0),   // bottom-right
    new Vector3(-1, 1, 0),   // top-left
    new Vector3(1, 1, 0),    // top-right
  ].flatMap(position => position.xyz));

  // Texture coordinates
  const texPositions = new Float32Array([
    0, 0,  // bottom-left
    1, 0,  // bottom-right
    0, 1,  // top-left
    1, 1,  // top-right
  ]);

  const attributes = new VertexAttributes();
  attributes.addAttribute('position', 4, 3, positions);
  attributes.addAttribute('texPosition', 4, 2, texPositions);

  const vertexSource = await fetchText('flat-vertex.glsl');
  const fragmentSource = await fetchText('flat-fragment.glsl');
  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);

  vao = new VertexArray(shaderProgram, attributes);

  // Create and configure the texture
  texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindTexture(gl.TEXTURE_2D, null);  // Setup button event listeners
  document.getElementById('btn-colored-static')?.addEventListener('click', () => updateTexture(generateColoredStatic(imageWidth, imageHeight)));
  document.getElementById('btn-static-no-red')?.addEventListener('click', () => updateTexture(generateStaticNoRed(imageWidth, imageHeight)));
  document.getElementById('btn-grayscale-static')?.addEventListener('click', () => updateTexture(generateGrayscaleStatic(imageWidth, imageHeight)));
  document.getElementById('btn-distance')?.addEventListener('click', () => updateTexture(generateDistanceFromCenter(imageWidth, imageHeight)));
  document.getElementById('btn-checkerboard')?.addEventListener('click', () => updateTexture(generateCheckerboard(imageWidth, imageHeight)));
  document.getElementById('btn-xor')?.addEventListener('click', () => updateTexture(generateXorPattern(imageWidth, imageHeight)));
  document.getElementById('btn-sine')?.addEventListener('click', () => updateTexture(generateSinePattern(imageWidth, imageHeight)));

  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());

  // Initialize with colored static
  updateTexture(generateColoredStatic(imageWidth, imageHeight));
  resizeCanvas();
}

function updateTexture(pixels: Uint8ClampedArray) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageWidth, imageHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
  render();
}

function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  shaderProgram.bind();
  shaderProgram.setUniform1i('imageTexture', 0);
  
  // Bind texture to texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);  vao.bind();
  vao.drawSequence(gl.TRIANGLE_STRIP);
  vao.unbind();

  gl.bindTexture(gl.TEXTURE_2D, null);
  shaderProgram.unbind();
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  render();
}

window.addEventListener('load', () => initialize());
