import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/gc': {
        target: 'https://chanani.goatcounter.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gc/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          markdown: [
            'react-markdown',
            'react-syntax-highlighter',
            'remark-gfm',
            'rehype-raw',
          ],
        },
      },
    },
  },
});
