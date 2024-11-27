// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true, // Permite importar módulos con el protocolo `node:`
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      buffer: 'buffer', // Alias para `buffer`
      process: 'process/browser', // Alias para `process`
    },
  },
  define: {
    global: 'globalThis', // Define `global` como `globalThis`
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis', // Asegura que `global` sea reconocido como `globalThis`
      },
    },
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()], // Incluye los polyfills de Rollup
    },
  },
});
