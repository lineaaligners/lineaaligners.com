import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// VITE_BASE is the public path when the viewer is hosted under a sub-folder, e.g. /dicomviewer/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  optimizeDeps: { exclude: ['@cornerstonejs/dicom-image-loader'], include: ['dicom-parser'] },
  worker: { format: 'es' },
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:8000' } },
  build: { target: 'es2022', chunkSizeWarningLimit: 6000 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as never);
