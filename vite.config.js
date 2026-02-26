import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const GC_BASE = 'https://chanani.goatcounter.com';

function dashboardPlugin(gcToken) {
  return {
    name: 'dashboard-api',
    configureServer(server) {
      server.middlewares.use('/api/dashboard', async (_req, res) => {
        const empty = { visitors: { today: 0, yesterday: 0, total: 0 }, topPosts: [], topBooks: [] };
        const json = (data) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };

        if (!gcToken) return json(empty);

        const headers = { 'Authorization': `Bearer ${gcToken}`, 'Content-Type': 'application/json' };
        const now = new Date();
        const todayStart = new Date(now); todayStart.setUTCHours(0, 0, 0, 0);
        const weekAgo = new Date(todayStart); weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

        try {
          const gcFetch = (path) => fetch(`${GC_BASE}${path}`, { headers, redirect: 'follow' }).then(r => r.ok ? r.json() : null);

          const [recent, allTime, hits] = await Promise.all([
            gcFetch(`/api/v0/stats/total/?start=${weekAgo.toISOString()}&end=${now.toISOString()}`),
            gcFetch(`/api/v0/stats/total/?start=2020-01-01T00:00:00Z&end=${now.toISOString()}`),
            gcFetch(`/api/v0/stats/hits/?start=${weekAgo.toISOString()}&end=${now.toISOString()}&limit=100&daily=true`),
          ]);

          const todayStr = todayStart.toISOString().split('T')[0];
          const yd = new Date(todayStart); yd.setUTCDate(yd.getUTCDate() - 1);
          const stats = recent?.stats || [];

          const topPosts = (hits?.hits || []).filter(h => h.path && decodeURIComponent(h.path).startsWith('/post/')).slice(0, 10).map(h => ({ path: decodeURIComponent(h.path), title: h.title || decodeURIComponent(h.path), count: h.count }));

          const bookMap = {};
          (hits?.hits || []).filter(h => h.path && decodeURIComponent(h.path).match(/^\/book\/[^/]+/)).forEach(h => {
            const decoded = decodeURIComponent(h.path);
            const slug = decoded.match(/^\/book\/([^/]+)/)[1];
            if (!bookMap[slug]) bookMap[slug] = { slug, title: '', count: 0 };
            bookMap[slug].count += h.count;
            if (!bookMap[slug].title || decoded === `/book/${slug}`) bookMap[slug].title = h.title || slug;
          });

          json({
            visitors: { today: stats.find(s => s.day === todayStr)?.daily || 0, yesterday: stats.find(s => s.day === yd.toISOString().split('T')[0])?.daily || 0, total: allTime?.total || 0 },
            topPosts,
            topBooks: Object.values(bookMap).sort((a, b) => b.count - a.count).slice(0, 3),
          });
        } catch { json(empty); }
      });
    },
  };
}

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), dashboardPlugin(env.GOATCOUNTER_API_TOKEN), goatcounterPlugin()],
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
  };
});
