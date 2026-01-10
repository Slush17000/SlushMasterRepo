import { noiseGlobe } from 'lib/noise.js';
import { lerp } from 'lib/math-utilities.js';
const earthBands = [
    // Deep ocean trench
    {
        min: 0.0,
        max: 0.28,
        colorStart: [5, 15, 45], // Very deep blue
        colorEnd: [10, 25, 65] // Deep blue
    },
    // Deep ocean
    {
        min: 0.28,
        max: 0.40,
        colorStart: [10, 25, 65], // Deep blue
        colorEnd: [20, 50, 100] // Medium-deep blue
    },
    // Ocean
    {
        min: 0.40,
        max: 0.47,
        colorStart: [20, 50, 100], // Medium-deep blue
        colorEnd: [30, 80, 150] // Ocean blue
    },
    // Shallow water
    {
        min: 0.47,
        max: 0.49,
        colorStart: [30, 80, 150], // Ocean blue
        colorEnd: [60, 120, 180] // Light blue
    },
    // Coastal shallows
    {
        min: 0.49,
        max: 0.505,
        colorStart: [60, 120, 180], // Light blue
        colorEnd: [100, 160, 200] // Very light blue
    },
    // Sandy beach
    {
        min: 0.505,
        max: 0.52,
        colorStart: [194, 178, 128], // Wet sand
        colorEnd: [210, 190, 140] // Dry sand
    },
    // Coastal vegetation
    {
        min: 0.52,
        max: 0.56,
        colorStart: [85, 140, 50], // Coastal green
        colorEnd: [75, 130, 45] // Dark coastal green
    },
    // Lowland forest
    {
        min: 0.56,
        max: 0.62,
        colorStart: [60, 120, 40], // Dark green
        colorEnd: [70, 135, 50] // Forest green
    },
    // Grassland/Plains
    {
        min: 0.62,
        max: 0.68,
        colorStart: [95, 150, 60], // Light green
        colorEnd: [110, 160, 70] // Bright grassland
    },
    // Highland vegetation
    {
        min: 0.68,
        max: 0.73,
        colorStart: [100, 145, 65], // Yellow-green
        colorEnd: [115, 130, 70] // Olive green
    },
    // Rocky foothills
    {
        min: 0.73,
        max: 0.78,
        colorStart: [120, 115, 85], // Brown-green
        colorEnd: [130, 120, 90] // Light brown
    },
    // Mountain slopes
    {
        min: 0.78,
        max: 0.83,
        colorStart: [130, 120, 90], // Light brown
        colorEnd: [145, 130, 100] // Rocky tan
    },
    // High mountains
    {
        min: 0.83,
        max: 0.88,
        colorStart: [145, 130, 100], // Rocky tan
        colorEnd: [160, 145, 120] // Light rock
    },
    // Mountain peaks
    {
        min: 0.88,
        max: 0.92,
        colorStart: [160, 145, 120], // Light rock
        colorEnd: [180, 170, 150] // Pale rock
    },
    // Snow line
    {
        min: 0.92,
        max: 0.96,
        colorStart: [200, 200, 210], // Light snow
        colorEnd: [225, 225, 235] // Bright snow
    },
    // Snow caps
    {
        min: 0.96,
        max: 1.0,
        colorStart: [225, 225, 235], // Bright snow
        colorEnd: [245, 250, 255] // Pure white snow
    }
];
const alienBands = [
    // Deep liquid methane sea
    {
        min: 0.0,
        max: 0.28,
        colorStart: [25, 5, 40], // Deep purple
        colorEnd: [35, 10, 60] // Purple
    },
    // Methane ocean
    {
        min: 0.28,
        max: 0.40,
        colorStart: [35, 10, 60], // Purple
        colorEnd: [50, 20, 85] // Medium purple
    },
    // Liquid pools
    {
        min: 0.40,
        max: 0.47,
        colorStart: [50, 20, 85], // Medium purple
        colorEnd: [70, 35, 110] // Light purple
    },
    // Shallow liquid
    {
        min: 0.47,
        max: 0.49,
        colorStart: [70, 35, 110], // Light purple
        colorEnd: [95, 50, 135] // Bright purple
    },
    // Coastal pools
    {
        min: 0.49,
        max: 0.505,
        colorStart: [95, 50, 135], // Bright purple
        colorEnd: [120, 70, 155] // Very light purple
    },
    // Crystalline shore
    {
        min: 0.505,
        max: 0.52,
        colorStart: [245, 245, 245], // Bright white shore
        colorEnd: [245, 245, 245] // Bright white shore
    },
    // Low plains
    {
        min: 0.52,
        max: 0.56,
        colorStart: [215, 215, 215], // Off-white
        colorEnd: [215, 215, 215] // Off-white
    },
    // Lowlands
    {
        min: 0.56,
        max: 0.62,
        colorStart: [190, 190, 190], // Light gray
        colorEnd: [190, 190, 190] // Light gray
    },
    // Plains
    {
        min: 0.62,
        max: 0.68,
        colorStart: [165, 165, 165], // Medium-light gray
        colorEnd: [165, 165, 165] // Medium-light gray
    },
    // Highlands
    {
        min: 0.68,
        max: 0.73,
        colorStart: [140, 140, 140], // Medium gray
        colorEnd: [140, 140, 140] // Medium gray
    },
    // Foothills
    {
        min: 0.73,
        max: 0.78,
        colorStart: [115, 115, 115], // Medium-dark gray
        colorEnd: [115, 115, 115] // Medium-dark gray
    },
    // Mountain slopes
    {
        min: 0.78,
        max: 0.83,
        colorStart: [90, 90, 90], // Dark gray
        colorEnd: [90, 90, 90] // Dark gray
    },
    // High mountains
    {
        min: 0.83,
        max: 0.88,
        colorStart: [65, 65, 65], // Very dark gray
        colorEnd: [65, 65, 65] // Very dark gray
    },
    // Mountain peaks
    {
        min: 0.88,
        max: 0.92,
        colorStart: [40, 40, 40], // Almost black
        colorEnd: [40, 40, 40] // Almost black
    },
    // High peaks
    {
        min: 0.92,
        max: 0.96,
        colorStart: [20, 20, 20], // Near black
        colorEnd: [20, 20, 20] // Near black
    },
    // Highest peaks
    {
        min: 0.96,
        max: 1.0,
        colorStart: [0, 0, 0], // Pure black
        colorEnd: [0, 0, 0] // Pure black
    }
];
let currentBands = earthBands;
let isEarthMode = true;
function getTerrainColor(noiseValue) {
    // Find the appropriate band
    for (const band of currentBands) {
        if (noiseValue >= band.min && noiseValue <= band.max) {
            // Calculate proportion within the band
            const proportion = (noiseValue - band.min) / (band.max - band.min);
            // Lerp between start and end colors
            const r = Math.floor(lerp(band.colorStart[0], band.colorEnd[0], proportion));
            const g = Math.floor(lerp(band.colorStart[1], band.colorEnd[1], proportion));
            const b = Math.floor(lerp(band.colorStart[2], band.colorEnd[2], proportion));
            return [r, g, b];
        }
    }
    // Default to white if somehow outside all bands
    return [255, 255, 255];
}
let cachedNoiseData = null;
function renderGlobe() {
    if (!cachedNoiseData)
        return;
    const { continentNoise, detailNoise, width, height } = cachedNoiseData;
    // Create a flat Uint8ClampedArray with RGBA values
    const pixels = new Uint8ClampedArray(width * height * 4);
    // Iterate through the field and map noise values to colors
    for (let i = 0; i < continentNoise.values.length; i++) {
        // Combine noise layers - continents define major features, detail adds variation
        const baseNoise = continentNoise.values[i];
        const detail = detailNoise.values[i];
        // Weight detail noise more to create more fragmented coastlines and islands
        const noiseValue = baseNoise * 0.5 + detail * 0.5;
        const [r, g, b] = getTerrainColor(noiseValue);
        const pixelIndex = i * 4;
        pixels[pixelIndex] = r;
        pixels[pixelIndex + 1] = g;
        pixels[pixelIndex + 2] = b;
        pixels[pixelIndex + 3] = 255; // Alpha channel (fully opaque)
    }
    // Display the image
    const image = document.getElementById('image');
    const imageData = new ImageData(pixels, width, height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    image.src = canvas.toDataURL();
}
async function initialize() {
    // Parameters for the noisy globe
    const width = 1024;
    const height = 512;
    // Generate multiple noise layers at different scales
    const continentNoise = noiseGlobe(width, height, 2000, 10); // Even larger continental features
    const detailNoise = noiseGlobe(width, height, 10, 10); // More detailed variation
    // Cache the noise data for re-rendering
    cachedNoiseData = { continentNoise, detailNoise, width, height };
    // Initial render
    renderGlobe();
    // Setup button listener
    const button = document.getElementById('planetToggle');
    if (button) {
        button.addEventListener('click', () => {
            console.log('Button clicked! Switching to', isEarthMode ? 'alien' : 'earth');
            isEarthMode = !isEarthMode;
            currentBands = isEarthMode ? earthBands : alienBands;
            button.textContent = isEarthMode ? 'Switch to Alien Planet' : 'Switch to Earth';
            renderGlobe();
        });
    }
    else {
        console.error('Button not found!');
    }
}
window.addEventListener('load', () => initialize());
