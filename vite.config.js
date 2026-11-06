import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'export-tools': ['jspdf', 'html-to-image'],
          'crop-and-csv': ['papaparse', 'react-easy-crop', 'qrcode.react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
