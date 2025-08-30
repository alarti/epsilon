import { createNoise2D } from 'https://esm.sh/simplex-noise@4.0.1';

// Initialize the noise function
const noise2D = createNoise2D();

self.onmessage = (event) => {
  const { width, height, segments, scale, amplitude, offsetX, offsetZ } = event.data;

  const heightmap = new Float32Array((segments + 1) * (segments + 1));

  let index = 0;
  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const x = (j * width) / segments;
      const z = (i * height) / segments;

      // Use world coordinates for noise calculation to ensure seamless chunks
      const noiseValue = noise2D((x + offsetX) * scale, (z + offsetZ) * scale);

      // Store the height value
      heightmap[index] = noiseValue * amplitude;
      index++;
    }
  }

  // Post the heightmap and its position back to the main thread
  self.postMessage({ heightmap, offsetX, offsetZ });
};
