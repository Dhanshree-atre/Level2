import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for WASM-based ZK proof generation in-browser
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/dapp-connector-api'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer (used by WASM proof generation)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
