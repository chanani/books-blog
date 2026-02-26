import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function goatcounterPlugin() {
  return {
    name: 'goatcounter-views',
    configureServer(server) {
      server.middlewares.use('/api/views', async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const path = url.searchParams.get('path');
        if (!path) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ count: '0' }));
          return;
        }

        const browserPath = encodeURI(path);
        const apiUrl = `https://chanani.goatcounter.com/counter/${encodeURIComponent(browserPath)}.json`;

        try {
          const response = await fetch(apiUrl);
          if (!response.ok) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ count: '0' }));
            return;
          }
          const data = await response.json();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        } catch {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ count: '0' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), goatcounterPlugin()],
  server: {
    proxy: {
      '/gc/count': {
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
