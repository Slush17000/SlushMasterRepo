export var BufferType;
(function (BufferType) {
    BufferType[BufferType["UnsignedByte"] = 5121] = "UnsignedByte";
    BufferType[BufferType["Short"] = 5123] = "Short";
    BufferType[BufferType["Int"] = 5125] = "Int";
    BufferType[BufferType["Float"] = 5126] = "Float";
})(BufferType || (BufferType = {}));
const componentCounts = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16,
};
async function readExternalBuffer(path, buffer) {
    // The external buffers are in the same directory as the model file.
    // We extract the parent directory from the path.
    const directory = path.split('/').slice(0, -1).join('/');
    const response = await fetch(`${directory}/${buffer}`);
    return await response.arrayBuffer();
}
function extractBuffer(gltf, buffers, accessor) {
    const bufferView = gltf.bufferViews[accessor.bufferView];
    // How many numbers is each sample?
    const componentCount = componentCounts[accessor.type];
    const componentType = accessor.componentType;
    const associationType = accessor.type;
    const offset = (accessor.byteOffset || 0) + (bufferView.byteOffset || 0);
    const count = accessor.count;
    let buffer;
    if (componentType == BufferType.Float) {
        buffer = new Float32Array(buffers[bufferView.buffer], offset, accessor.count * componentCount);
        return { componentCount, buffer, associationType, componentType, count };
    }
    else if (componentType == BufferType.Int) {
        buffer = new Uint32Array(buffers[bufferView.buffer], offset, accessor.count * componentCount);
        return { componentCount, buffer, associationType, componentType, count };
    }
    else if (componentType == BufferType.Short) {
        buffer = new Uint16Array(buffers[bufferView.buffer], offset, accessor.count * componentCount);
        return { componentCount, buffer, associationType, componentType, count };
    }
    else if (componentType == BufferType.UnsignedByte) {
        buffer = new Uint8Array(buffers[bufferView.buffer], offset, accessor.count * componentCount);
        return { componentCount, buffer, associationType, componentType, count };
    }
    else {
        throw `unknown component type ${componentType}`;
    }
}
function getAccessor(gltf, mesh, attributeName) {
    const attribute = mesh.primitives[0].attributes[attributeName];
    return gltf.accessors[attribute];
}
function extractNamedBuffer(gltf, buffers, mesh, name) {
    if (mesh.primitives[0].attributes[name] === undefined) {
        return null;
    }
    const accessor = getAccessor(gltf, mesh, name);
    return extractBuffer(gltf, buffers, accessor);
}
function extractNodes(index, node) {
    return {
        id: index,
        name: node.name,
        children: node.children || [],
        mesh: node.mesh
    };
}
function extractMesh(gltf, mesh, buffers) {
    let indices = null;
    // TODO: this only loads the first part of the mesh.
    if (mesh.primitives[0].indices) {
        const indexAccessor = gltf.accessors[mesh.primitives[0].indices];
        const indexBuffer = extractBuffer(gltf, buffers, indexAccessor);
        indices = {
            buffer: indexBuffer.buffer,
            count: indexBuffer.buffer.length,
        };
    }
    return {
        indices,
        positions: extractNamedBuffer(gltf, buffers, mesh, 'POSITION'),
        colors: extractNamedBuffer(gltf, buffers, mesh, 'COLOR_0'),
        normals: extractNamedBuffer(gltf, buffers, mesh, 'NORMAL'),
        tangents: extractNamedBuffer(gltf, buffers, mesh, 'TANGENT'),
    };
}
export class Gltf {
    constructor(name, meshes, nodes) {
        this.name = name;
        this.meshes = meshes;
        this.nodes = nodes;
    }
    static async readFromUrl(url) {
        const response = await fetch(url);
        const gltf = await response.json();
        // TODO: assign defaults.
        // Read in all external buffers, like textures.
        const bufferPromises = gltf.buffers.map(buffer => readExternalBuffer(url, buffer.uri));
        const buffers = await Promise.all(bufferPromises);
        // glTF files may have multiple scenes. A scene has a list of nodes. Nodes
        // individually specify transformations, meshes, and children, forming a
        // scene graph. The scene's nodes are the roots of separate graphs.
        const scene = gltf.scenes[gltf.scene];
        // Extract the meshes.
        const meshes = gltf.meshes.map(mesh => extractMesh(gltf, mesh, buffers));
        const rootNode = scene.nodes[0];
        const nodes = gltf.nodes.map((node, i) => extractNodes(i, node));
        // Use last component as name.
        const pathComponents = url.split('/');
        const name = pathComponents[pathComponents.length - 1];
        return new Gltf(name, meshes, nodes);
    }
}
