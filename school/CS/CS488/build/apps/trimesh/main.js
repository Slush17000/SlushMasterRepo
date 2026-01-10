import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';
import { Prefab } from 'lib/prefab.js';
import { identityMatrix4 } from 'lib/math-utilities.js';
let canvas;
let shaderProgram;
let vaoGrid;
let vaoCyl;
let vaoCone;
let vaoSphere;
// Loading a glTF model:
// const model = await Gltf.readFromUrl('directory/to/model.gltf');
// const attributes = new VertexAttributes();
// attributes.addAttribute('position', model.meshes[0].positions.count, 3, model.meshes[0].positions.buffer);
// attributes.addAttribute('normal', model.meshes[0].normals!.count, 3, model.meshes[0].normals!.buffer);
// attributes.addIndices(model.meshes[0].indices!.buffer);
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    // Initialize other graphics state as needed.
    const colors = new Float32Array([
        1, 0, 1, // 0
        1, 0, 0, // 1
        0, 0, 1, // 2
    ]);
    // Rectangle Mesh
    const width1 = 0.5;
    const height1 = 0.5;
    const longitudeCount1 = 10;
    const latitudeCount1 = 10;
    const trimesh1 = Prefab.grid(width1, height1, longitudeCount1, latitudeCount1);
    const gridAttributes = new VertexAttributes();
    trimesh1.computeNormals();
    const gridNormals = trimesh1.normalBuffer;
    gridAttributes.addAttribute('position', trimesh1.vertexCount, 3, trimesh1.positionBuffer);
    gridAttributes.addIndices(trimesh1.faceBuffer);
    gridAttributes.addAttribute('color', trimesh1.vertexCount, 3, colors);
    gridAttributes.addAttribute('normal', trimesh1.vertexCount, 3, gridNormals);
    // Cylinder Mesh
    const radius1 = 0.3;
    const height2 = 0.5;
    const longitudeCount2 = 10;
    const latitudeCount2 = 10;
    const trimesh2 = Prefab.cylinder(radius1, height2, longitudeCount2, latitudeCount2);
    const cylAttributes = new VertexAttributes();
    trimesh2.computeNormals();
    const cylNormals = trimesh2.normalBuffer;
    cylAttributes.addAttribute('position', trimesh2.vertexCount, 3, trimesh2.positionBuffer);
    cylAttributes.addIndices(trimesh2.faceBuffer);
    cylAttributes.addAttribute('color', trimesh2.vertexCount, 3, colors);
    cylAttributes.addAttribute('normal', trimesh2.vertexCount, 3, cylNormals);
    // Cone Mesh
    const topRadius1 = 0.001;
    const bottomRadius1 = 0.4;
    const length1 = 0.5;
    const longitudeCount3 = 10;
    const latitudeCount3 = 10;
    const trimesh3 = Prefab.cone(topRadius1, bottomRadius1, length1, longitudeCount3, latitudeCount3);
    const coneAttributes = new VertexAttributes();
    trimesh3.computeNormals();
    const coneNormals = trimesh3.normalBuffer;
    coneAttributes.addAttribute('position', trimesh3.vertexCount, 3, trimesh3.positionBuffer);
    coneAttributes.addIndices(trimesh3.faceBuffer);
    coneAttributes.addAttribute('color', trimesh3.vertexCount, 3, colors);
    coneAttributes.addAttribute('normal', trimesh3.vertexCount, 3, coneNormals);
    // Sphere Mesh
    const radius2 = 0.3;
    const longitudeCount4 = 10;
    const latitudeCount4 = 10;
    const trimesh4 = Prefab.sphere(radius2, longitudeCount4, latitudeCount4);
    const sphereAttributes = new VertexAttributes();
    trimesh4.computeNormals();
    const sphereNormals = trimesh4.normalBuffer;
    sphereAttributes.addAttribute('position', trimesh4.vertexCount, 3, trimesh4.positionBuffer);
    sphereAttributes.addIndices(trimesh4.faceBuffer);
    sphereAttributes.addAttribute('color', trimesh4.vertexCount, 3, colors);
    sphereAttributes.addAttribute('normal', trimesh4.vertexCount, 3, sphereNormals);
    // Load, compile, and link shaders
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    // Create VAOs
    vaoGrid = new VertexArray(shaderProgram, gridAttributes);
    vaoCyl = new VertexArray(shaderProgram, cylAttributes);
    vaoCone = new VertexArray(shaderProgram, coneAttributes);
    vaoSphere = new VertexArray(shaderProgram, sphereAttributes);
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    resizeCanvas();
}
function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Cornflower:
    // gl.clearColor(0.392, 0.584, 0.929, 1);
    // Purple:
    // gl.clearColor(0.625, 0, 1, 1);
    // Spring Green:
    // gl.clearColor(0, 1, 0.5, 1);
    // Turqouoise:
    //gl.clearColor(0.251, 0.878, 0.816, 1);
    // Red
    // gl.clearColor(1, 0, 0, 1);
    // Turquoise:
    //gl.clearColor(0.251, 0.878, 0.816, 1);
    // Black:
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    shaderProgram.bind();
    // Grid -> top-left
    vaoGrid.bind();
    shaderProgram.setUniformMatrix4fv("clipFromWorld", identityMatrix4());
    shaderProgram.setUniform1f("radians", 0.0);
    shaderProgram.setUniform3f("factors", 1.0, 1.0, 1.0); // optional scale down
    shaderProgram.setUniform3f("offsets", -0.75, 0.25, 0.0); // top-left
    vaoGrid.drawIndexed(gl.LINE_STRIP);
    vaoGrid.unbind();
    // Cylinder -> top-right
    vaoCyl.bind();
    shaderProgram.setUniformMatrix4fv("clipFromWorld", identityMatrix4());
    shaderProgram.setUniform1f("radians", 0.0);
    shaderProgram.setUniform3f("factors", 1.0, 1.0, 1.0);
    shaderProgram.setUniform3f("offsets", 0.5, 0.25, 0.0); // top-right
    vaoCyl.drawIndexed(gl.LINE_STRIP);
    vaoCyl.unbind();
    // Cone -> bottom-left
    vaoCone.bind();
    shaderProgram.setUniformMatrix4fv("clipFromWorld", identityMatrix4());
    shaderProgram.setUniform1f("radians", 0.0);
    shaderProgram.setUniform3f("factors", 1.0, 1.0, 1.0);
    shaderProgram.setUniform3f("offsets", -0.5, -0.65, 0.0); // bottom-left
    vaoCone.drawIndexed(gl.LINE_STRIP);
    vaoCone.unbind();
    // Sphere -> bottom-right
    vaoSphere.bind();
    shaderProgram.setUniformMatrix4fv("clipFromWorld", identityMatrix4());
    shaderProgram.setUniform1f("radians", 0.0);
    shaderProgram.setUniform3f("factors", 1.0, 1.0, 1.0);
    shaderProgram.setUniform3f("offsets", 0.5, -0.45, 0.0); // bottom-right
    vaoSphere.drawIndexed(gl.LINE_STRIP);
    vaoSphere.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
}
window.addEventListener('load', () => initialize());
