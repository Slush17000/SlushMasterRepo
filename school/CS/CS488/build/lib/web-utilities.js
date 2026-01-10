export async function fetchText(url) {
    const response = await fetch(url);
    const text = await response.text();
    return text;
}
export function downloadBlob(name, blob) {
    // Inject a link element into the page. Clicking on
    // it makes the browser download the binary data.
    let link = document.createElement('a');
    link.download = name;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    // Remove the link after a slight pause. Browsers...
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    });
}
export async function takeScreenshot(canvas) {
    const png = await new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
    });
    downloadBlob('screenshot.png', png);
}
export async function fetchImage(url) {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
}
export function generateRgbaImage(width, height) {
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
export function generateGrayscaleImage(width, height) {
    const pixels = new Uint8ClampedArray(width * height);
    for (let r = 0; r < height; ++r) {
        for (let c = 0; c < width; ++c) {
            let i = r * width + c;
            pixels[i] = 128;
        }
    }
    return pixels;
}
export function generateCheckerboardImage(width, height) {
    const n = width * height * 4;
    const pixels = new Uint8ClampedArray(n);
    for (let r = 0; r < height; ++r) {
        for (let c = 0; c < width; ++c) {
            let i = (r * width + c) * 4;
            const isWhite = (Math.floor(r / 10) + Math.floor(c / 10)) % 2 === 0;
            pixels[i + 0] = isWhite ? 255 : 0; // R
            pixels[i + 1] = isWhite ? 255 : 0; // G
            pixels[i + 2] = isWhite ? 255 : 0; // B
            pixels[i + 3] = 255; // A
        }
    }
    return pixels;
}
export function generateAlphaGradientImage(width, height) {
    const n = width * height * 4;
    const pixels = new Uint8ClampedArray(n);
    for (let r = 0; r < height; ++r) {
        for (let c = 0; c < width; ++c) {
            let i = (r * width + c) * 4;
            pixels[i + 0] = 0; // R
            pixels[i + 1] = 0; // G
            pixels[i + 2] = 255; // B
            pixels[i + 3] = (c / width) * 255; // A gradient from 0 to 255
        }
    }
    return pixels;
}
export function padToPot(image) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = powerOfTwoCeiling(image.width);
    canvas.height = powerOfTwoCeiling(image.height);
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
}
export function powerOfTwoCeiling(x) {
    return Math.pow(2, Math.ceil(Math.log2(x)));
}
export function generateCrateTexture(width, height) {
    const n = width * height * 4;
    const pixels = new Uint8ClampedArray(n);
    const woodColor = { r: 139, g: 90, b: 43 };
    const darkWoodColor = { r: 101, g: 67, b: 33 };
    const plankWidth = width / 5;
    for (let r = 0; r < height; ++r) {
        for (let c = 0; c < width; ++c) {
            let i = (r * width + c) * 4;
            // Determine if we're on a plank edge
            const isVerticalEdge = (c % plankWidth < 2) || (c % plankWidth > plankWidth - 3);
            const isHorizontalEdge = (r % plankWidth < 2) || (r % plankWidth > plankWidth - 3);
            const isEdge = isVerticalEdge || isHorizontalEdge;
            // Add some wood grain variation
            const grain = Math.sin(r * 0.1) * 10 + Math.sin(c * 0.05) * 8;
            if (isEdge) {
                pixels[i + 0] = darkWoodColor.r + grain;
                pixels[i + 1] = darkWoodColor.g + grain * 0.5;
                pixels[i + 2] = darkWoodColor.b + grain * 0.3;
            }
            else {
                pixels[i + 0] = woodColor.r + grain;
                pixels[i + 1] = woodColor.g + grain * 0.5;
                pixels[i + 2] = woodColor.b + grain * 0.3;
            }
            pixels[i + 3] = 255;
        }
    }
    return pixels;
}
export async function loadCubemap(directoryUrl, extension, textureUnit = gl.TEXTURE0) {
    const faces = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];
    const images = await Promise.all(faces.map(face => {
        const url = `${directoryUrl}/${face}.${extension}`;
        return fetchImage(url);
    }));
    gl.activeTexture(textureUnit);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[0]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[1]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[2]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[3]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[4]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[5]);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    return texture;
}
