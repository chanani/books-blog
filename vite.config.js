import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import dashboardHandler from './api/dashboard.js';
import guestbookHandler from './api/guestbook.js';
import adminLoginHandler from './api/admin/login.js';
import adminStatsHandler from './api/admin/stats.js';

function dashboardPlugin(env) {
  return {
    name: 'dashboard-api',
    configureServer(server) {
      // loadEnv 결과를 process.env에 주입 (서버리스 핸들러가 사용)
      Object.assign(process.env, env);
      server.middlewares.use('/api/dashboard', (req, res) => {
        res.json = (data) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        };
        dashboardHandler(req, res);
      });
    },
  };
}

function guestbookPlugin(env) {
  return {
    name: 'guestbook-api',
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use('/api/guestbook', (req, res) => {
        req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
        res.json = (data) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        };
        guestbookHandler(req, res);
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

function adminLoginPlugin(env) {
  return {
    name: 'admin-login-api',
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use('/api/admin/login', (req, res) => {
        res.json = (data) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        };
        adminLoginHandler(req, res);
      });
    },
  };
}

function adminStatsPlugin(env) {
  return {
    name: 'admin-stats-api',
    configureServer(server) {
      Object.assign(process.env, env);
      server.middlewares.use('/api/admin/stats', (req, res) => {
        res.json = (data) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        };
        adminStatsHandler(req, res);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      dashboardPlugin(env),
      guestbookPlugin(env),
      goatcounterPlugin(),
      adminLoginPlugin(env),
      adminStatsPlugin(env),
    ],
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
