import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the app from /<repo>/. Override with BASE_PATH when the
// deployment target differs.
const base = process.env.BASE_PATH ?? '/seat-allocation/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});
