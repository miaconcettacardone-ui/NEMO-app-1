import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` so the build runs on GitHub Pages, MAMP, or any subpath.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || './',
});
