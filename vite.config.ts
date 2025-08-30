import { resolve } from 'path';
import { defineConfig } from 'vite';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';

const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  manifest: {
    name: 'Chronosplit - 3D Runner',
    short_name: 'Chronosplit',
    description: 'An infinitely replayable, AI-driven 3D web game.',
    theme_color: '#1a1a1a',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
};

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  return {
    base: isBuild ? '/epsilon/' : '/',
    plugins: [VitePWA(pwaOptions)],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
  };
});
