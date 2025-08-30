import { createNoise2D } from 'https://esm.sh/simplex-noise@4.0.1';

// Initialize the noise function
const noise2D = createNoise2D();

self.onmessage = (event) => {
  console.log('Worker received a message.');
  const { width, height, segments, scale, amplitude } = event.data;

  const heightmap = new Float32Array((segments + 1) * (segments + 1));

  let index = 0;
  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const x = (j * width) / segments;
      const y = (i * height) / segments;

      // Simple noise calculation
      const noiseValue = noise2D(x * scale, y * scale);

      // Store the height value
      heightmap[index] = noiseValue * amplitude;
      index++;
    }
  }

  console.log('Worker finished generation, posting message back.');
  // Post the heightmap back to the main thread
  self.postMessage({ heightmap });
};
