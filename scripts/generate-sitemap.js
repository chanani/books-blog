import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://chanani-books.vercel.app';
const GITHUB_API = 'https://api.github.com';

const OWNER = process.env.VITE_GITHUB_OWNER || 'chanani';
const REPO = process.env.VITE_GITHUB_REPO || 'Books';
const BOOKS_PATH = process.env.VITE_GITHUB_PATH || 'books';
const TOKEN = process.env.VITE_GITHUB_TOKEN || '';

const headers = {
  Accept: 'application/vnd.github.v3+json',
};
if (TOKEN) {
  headers.Authorization = `token ${TOKEN}`;
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`Failed to fetch ${url}: ${res.status}`);
    return null;
  }
  return res.json();
}

async function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  // Static pages
  const urls = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/reading', changefreq: 'weekly', priority: '0.8' },
    { loc: '/about', changefreq: 'monthly', priority: '0.6' },
  ];

  // Fetch book directories
  const books = await fetchJSON(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${BOOKS_PATH}`
  );

  if (books && Array.isArray(books)) {
    for (const item of books) {
      if (item.type !== 'dir') continue;

      const slug = item.name;
      urls.push({
        loc: `/book/${slug}`,
        changefreq: 'weekly',
        priority: '0.7',
      });

      // Fetch chapters for each book
      const contents = await fetchJSON(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${BOOKS_PATH}/${slug}`
      );

      if (contents && Array.isArray(contents)) {
        for (const file of contents) {
          if (file.type === 'file' && file.name.endsWith('.md')) {
            const chapterPath = file.name.replace(/\.md$/, '');
            urls.push({
              loc: `/book/${slug}/read/${chapterPath}`,
              changefreq: 'monthly',
              priority: '0.5',
            });
          }
          // Handle subdirectories (folder groups)
          if (file.type === 'dir' && file.name !== '.git') {
            const subContents = await fetchJSON(file.url);
            if (subContents && Array.isArray(subContents)) {
              for (const subFile of subContents) {
                if (subFile.type === 'file' && subFile.name.endsWith('.md')) {
                  const chapterPath = `${file.name}/${subFile.name.replace(/\.md$/, '')}`;
                  urls.push({
                    loc: `/book/${slug}/read/${chapterPath}`,
                    changefreq: 'monthly',
                    priority: '0.5',
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${encodeURI(u.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Write to both public (for dev) and dist (for build)
  const publicPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(publicPath, xml, 'utf-8');
  console.log(`Sitemap generated with ${urls.length} URLs → ${publicPath}`);

  const distPath = path.resolve(__dirname, '../dist/sitemap.xml');
  if (fs.existsSync(path.dirname(distPath))) {
    fs.writeFileSync(distPath, xml, 'utf-8');
    console.log(`Sitemap also written to → ${distPath}`);
  }
}

generateSitemap().catch(console.error);
