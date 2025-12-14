import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        faculty: resolve(__dirname, 'faculty.html'), // Added this
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  }
});