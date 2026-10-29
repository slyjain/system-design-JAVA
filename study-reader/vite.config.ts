import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { noteDatesPlugin } from './gitDates';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  plugins: [react(), noteDatesPlugin(repoRoot)],
  // GitHub Pages serves project sites from /repository-name/.
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(firebase|@firebase)\//.test(id)) return 'firebase';
        },
      },
    },
  },
  server: {
    // The notes intentionally live outside the frontend's project directory.
    fs: { allow: [repoRoot] },
  },
});
