import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the frontend runs on 5173 and the API on 3000. The proxy makes
// `/api/*` calls hit the backend so the app uses same-origin relative URLs
// everywhere (identical to the single-service production deployment).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
