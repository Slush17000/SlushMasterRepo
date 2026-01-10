import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';

import { Vector3 } from 'lib/vector.js';
let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let vao1: VertexArray, vao2: VertexArray, vao3: VertexArray, vao4: VertexArray, vao5: VertexArray, vao6: VertexArray, vaoFill: VertexArray;
let attributes: VertexAttributes, attributes1: VertexAttributes, attributes2: VertexAttributes, attributes3: VertexAttributes, attributes4: VertexAttributes, attributes5: VertexAttributes, attributes6: VertexAttributes;
let vectorGroups: Vector3[][] = [];
let clipFromWorld: Float32Array;

function initializeOutlineVaos() {

  const outlinePositions = [
    [-2, -2, 0, -1, -2, 0, -1, -1, 0, 0, -1, 0, 0, -2, 0, 1, -2, 0, 1, 0, 0, 2, 0, 0, 2, 1, 0, 1, 1, 0, 1, 2, 0, 0, 2, 0, 0, 0, 0, -2, 0, 0],
    [3, 4, 0, 1.5, 4, 0, 1.5, 5, 0, 0, 5, 0, 0, 4, 0, -1.5, 4, 0, -1.5, 6, 0, -3, 6, 0, -3, 7, 0, -1.5, 7, 0, -1.5, 8, 0, 0, 8, 0, 0, 6, 0, 3, 6, 0],
    [3.2679492235183716, -0.7320507764816284, 0.5, 4.133974611759186, -1.2320507764816284, 0.5, 4.633974611759186, -0.3660253882408142, 0.5, 5.5, -0.8660253882408142, 0.5, 5, -1.7320507764816284, 0.5, 5.866025388240814, -2.2320507764816284, 0.5, 6.866025388240814, -0.5, 0.5, 7.732050776481628, -1, 0.5, 8.232050776481628, -0.1339746117591858, 0.5, 7.366025388240814, 0.3660253882408142, 0.5, 7.866025388240814, 1.2320507764816284, 0.5, 7, 1.7320507764816284, 0.5, 6, 0, 0.5, 4.267949223518372, 1, 0.5],
    [4, 5, 0.5, 4, 5.5, 0.5, 5, 5.5, 0.5, 5, 6, 0.5, 4, 6, 0.5, 4, 6.5, 0.5, 6, 6.5, 0.5, 6, 7, 0.5, 7, 7, 0.5, 7, 6.5, 0.5, 8, 6.5, 0.5, 8, 6, 0.5, 6, 6, 0.5, 6, 5, 0.5],
    [14.732050776481628, 4.901923894882202, 0, 14.232050776481628, 6.200961947441101, 0, 13.366025388240814, 5.450961947441101, 0, 12.866025388240814, 6.75, 0, 13.732050776481628, 7.5, 0, 13.232050776481628, 8.799038052558899, 0, 11.5, 7.299038052558899, 0, 11, 8.598076105117798, 0, 10.133974611759186, 7.848076105117798, 0, 10.633974611759186, 6.549038052558899, 0, 9.767949223518372, 5.799038052558899, 0, 10.267949223518372, 4.5, 0, 12, 6, 0, 13, 3.401923894882202, 0],
    [10, 2.9999999999999996, 0, 11, 3, 0, 11, 1.4999999999999998, 0, 12, 1.5, 0, 12, 3, 0, 13, 3, 0, 13, 1.8369702788777518e-16, 0, 14, 3.6739405577555036e-16, 0, 14, -1.4999999999999996, 0, 13, -1.4999999999999998, 0, 13, -3, 0, 12, -3, 0, 12, 0, 0, 10, 0, 0]
  ];

  for (let list of outlinePositions) {
    let group: Vector3[] = [];
    for (let i = 0; i < list.length; i += 3) {
      group.push(new Vector3(list[i], list[i + 1], list[i + 2]));
    }
    group.push(group[0]);
    vectorGroups.push(group);
  }

  let flat_positions1 = new Float32Array(vectorGroups[0].flatMap(p => p.xyz));
  let flat_positions2 = new Float32Array(vectorGroups[1].flatMap(p => p.xyz));
  let flat_positions3 = new Float32Array(vectorGroups[2].flatMap(p => p.xyz));
  let flat_positions4 = new Float32Array(vectorGroups[3].flatMap(p => p.xyz));
  let flat_positions5 = new Float32Array(vectorGroups[4].flatMap(p => p.xyz));
  let flat_positions6 = new Float32Array(vectorGroups[5].flatMap(p => p.xyz));
  attributes1 = new VertexAttributes();
  attributes1.addAttribute('position', 14, 3, flat_positions1);
  attributes2 = new VertexAttributes();
  attributes2.addAttribute('position', 14, 3, flat_positions2);
  attributes3 = new VertexAttributes();
  attributes3.addAttribute('position', 14, 3, flat_positions3);
  attributes4 = new VertexAttributes();
  attributes4.addAttribute('position', 14, 3, flat_positions4);
  attributes5 = new VertexAttributes();
  attributes5.addAttribute('position', 14, 3, flat_positions5);
  attributes6 = new VertexAttributes();
  attributes6.addAttribute('position', 14, 3, flat_positions6);

}

function initializeFillVao() {
  let positions = [
    -2.0, -2.0, 0, // vertex 0
    -1.0, -2.0, 0, // vertex 1
    -1.0, -1.0, 0, // vertex 2
    0.0, -1.0, 0, // vertex 3
    0.0, -2.0, 0, // vertex 4
    1.0, -2.0, 0, // vertex 5
    1.0, 0.0, 0, // vertex 6
    2.0, 0.0, 0, // vertex 7
    2.0, 1.0, 0, // vertex 8
    1.0, 1.0, 0, // vertex 9
    1.0, 2.0, 0, // vertex 10
    0.0, 2.0, 0, // vertex 11
    0.0, 0.0, 0, // vertex 12
    -2.0, 0.0, 0  // vertex 13
  ];

  //turn into Vector3s
  let vectorPositions: Vector3[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    vectorPositions.push(new Vector3(positions[i], positions[i + 1], positions[i + 2]));
  }
  let flat_positions = new Float32Array(vectorPositions.flatMap(p => p.xyz));

  const indices = new Uint32Array([
    0, 1, 2, // Triangle 1
    0, 2, 13, // Triangle 2
    2, 12, 13, // Triangle 3
    2, 3, 12, // Triangle 4
    4, 10, 11, // Triangle 5
    4, 5, 10, // Triangle 6
    7, 8, 9, // Triangle 7
    7, 9, 6, // Triangle 8
  ])
  attributes = new VertexAttributes();
  attributes.addAttribute('position', 14, 3, flat_positions);
  attributes.addIndices(indices);

}

async function initialize() {

  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  initializeOutlineVaos();
  initializeFillVao();

  const vertexSource = await fetchText('flat-vertex.glsl');
  const fragmentSource = await fetchText('flat-fragment.glsl');
  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);

  vao1 = new VertexArray(shaderProgram, attributes1);
  vao2 = new VertexArray(shaderProgram, attributes2);
  vao3 = new VertexArray(shaderProgram, attributes3);
  vao4 = new VertexArray(shaderProgram, attributes4);
  vao5 = new VertexArray(shaderProgram, attributes5);
  vao6 = new VertexArray(shaderProgram, attributes6);

  vaoFill = new VertexArray(shaderProgram, attributes);

  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());

  resizeCanvas();
}

function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  shaderProgram.bind();
  shaderProgram.setUniformMatrix4fv('clipFromWorld', clipFromWorld);

  // Draw triangles first
  // #1
  vaoFill.bind();
  shaderProgram.setUniform3f('rgb', 0.0, 0.0, 1.0);
  shaderProgram.setUniform3f('factors', 1.0, 1.0, 1.0);
  shaderProgram.setUniform3f('offsets', 0.0, 0.0, 0.0);
  vaoFill.drawIndexed(gl.TRIANGLES);

  // #2
  shaderProgram.setUniform3f('rgb', 0.0, 1.0, 1.0);
  shaderProgram.setUniform3f('factors', 1.0, 1.0, 1.0);
  shaderProgram.setUniform3f('offsets', 6.0, 0.0, 0.0);
  shaderProgram.setUniform1f('radians', -(Math.PI / 6));
  vaoFill.drawIndexed(gl.TRIANGLES);

  // #3
  shaderProgram.setUniform3f('rgb', 1.0, 0.0, 1.0);
  shaderProgram.setUniform3f('factors', 1.0, -1.5, 1.0);
  shaderProgram.setUniform3f('offsets', 12.0, 0.0, 0.0);
  shaderProgram.setUniform1f('radians', 0);
  vaoFill.drawIndexed(gl.TRIANGLES);

  // #4
  shaderProgram.setUniform3f('rgb', 1.0, 1.0, 0.0);
  shaderProgram.setUniform3f('factors', 1.5, -1.0, 1.0);
  shaderProgram.setUniform3f('offsets', 0.0, 6.0, 0.0);
  shaderProgram.setUniform1f('radians', Math.PI);
  vaoFill.drawIndexed(gl.TRIANGLES);

  // #5
  shaderProgram.setUniform3f('rgb', 0.0, 1.0, 0.0);
  shaderProgram.setUniform3f('factors', -1.0, 0.5, 1.0);
  shaderProgram.setUniform3f('offsets', 6.0, 6.0, 0.0);
  shaderProgram.setUniform1f('radians', Math.PI / 2);
  vaoFill.drawIndexed(gl.TRIANGLES);

  // #6
  shaderProgram.setUniform3f('rgb', 1.0, 0.0, 0.0);
  shaderProgram.setUniform3f('factors', 1.0, 1.5, 1.0);
  shaderProgram.setUniform3f('offsets', 12.0, 6.0, 0.0);
  shaderProgram.setUniform1f('radians', 2 * Math.PI / 3);
  vaoFill.drawIndexed(gl.TRIANGLES);

  vaoFill.unbind();
  shaderProgram.setUniform3f('factors', 1.0, 1.0, 1.0);
  shaderProgram.setUniform3f('offsets', 0.0, 0.0, 0.0);
  shaderProgram.setUniform1f('radians', 0.0);

  // Draw outlines second (foreground)
  shaderProgram.setUniform3f('rgb', 0.0, 0.0, 0.0);
  vao1.bind();
  vao1.drawSequence(gl.LINE_LOOP);
  vao1.unbind();
  vao2.bind();
  vao2.drawSequence(gl.LINE_LOOP);
  vao2.unbind();
  vao3.bind();
  vao3.drawSequence(gl.LINE_LOOP);
  vao3.unbind();
  vao4.bind();
  vao4.drawSequence(gl.LINE_LOOP);
  vao4.unbind();
  vao5.bind();
  vao5.drawSequence(gl.LINE_LOOP);
  vao5.unbind();
  vao6.bind();
  vao6.drawSequence(gl.LINE_LOOP);
  vao6.unbind();

  shaderProgram.unbind();
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const size = 7;
  const center = [6, 3];
  if (aspectRatio >= 1) {
    clipFromWorld = ortho(center[0] - size * aspectRatio, center[0] + size * aspectRatio, center[1] - size, center[1] + size, -1, 1);
  } else {
    clipFromWorld = ortho(center[0] - size, center[0] + size, center[1] - size / aspectRatio, center[1] + size / aspectRatio, -1, 1);
  }
  render();
}

function ortho(left: number, right: number, bottom: number, top: number, near: number = -1, far: number = 1) {
  return new Float32Array([
    2 / (right - left), 0, 0, 0,
    0, 2 / (top - bottom), 0, 0,
    0, 0, 2 / (near - far), 0,
    -(right + left) / (right - left),
    -(top + bottom) / (top - bottom),
    (near + far) / (near - far),
    1,
  ]);
}

window.addEventListener('load', () => initialize());