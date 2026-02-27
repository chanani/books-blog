const GC_BASE = 'https://chanani.goatcounter.com';
const GH_API = 'https://api.github.com';

function ghHeaders(token) {
  return { Accept: 'application/vnd.github.v3+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function gcFetch(path, token) {
  const res = await fetch(`${GC_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    redirect: 'follow',
  });
  return res.ok ? res.json() : null;
}

async function resolvePostTitle(category, slug, owner, repo, token) {
  const headers = ghHeaders(token);
  try {
    const dirRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/dev/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`, { headers });
    if (dirRes.ok) {
      const files = await dirRes.json();
      const md = Array.isArray(files) && files.find((f) => f.type === 'file' && f.name.endsWith('.md'));
      if (md) {
        const fileRes = await fetch(md.url, { headers });
        if (fileRes.ok) {
          const data = await fileRes.json();
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          const m = content.match(/title:\s*["']?(.+?)["']?\s*$/m);
          if (m) return m[1];
        }
      }
    }
    const flatRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/dev/${encodeURIComponent(category)}/${encodeURIComponent(slug)}.md`, { headers });
    if (flatRes.ok) {
      const data = await flatRes.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const m = content.match(/title:\s*["']?(.+?)["']?\s*$/m);
      if (m) return m[1];
    }
  } catch {}
  return slug.replace(/_/g, ' ');
}

async function resolveBookInfo(slug, owner, repo, booksPath, token) {
  const headers = ghHeaders(token);
  try {
    const dirRes = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${booksPath}/${encodeURIComponent(slug)}`, { headers });
    if (!dirRes.ok) return { title: slug, cover: '' };
    const files = await dirRes.json();

    const coverFile = files.find((f) => /^cover\.(png|jpe?g|webp|gif|svg)$/i.test(f.name));
    const cover = coverFile?.download_url || '';

    const infoFile = files.find((f) => f.name === 'info.json');
    if (infoFile) {
      const infoRes = await fetch(infoFile.url, { headers });
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        const info = JSON.parse(Buffer.from(infoData.content, 'base64').toString('utf-8'));
        return { title: info.title || slug, cover };
      }
    }
    return { title: slug, cover };
  } catch {
    return { title: slug, cover: '' };
  }
}

export default async function handler(req, res) {
  const gcToken = process.env.GOATCOUNTER_API_TOKEN;
  const ghToken = process.env.VITE_GITHUB_TOKEN;
  const ghOwner = process.env.VITE_GITHUB_OWNER;
  const ghRepo = process.env.VITE_GITHUB_REPO;
  const booksPath = process.env.VITE_GITHUB_PATH || 'books';
  const empty = { visitors: { today: 0, yesterday: 0, total: 0 }, topPosts: [], topBooks: [] };

  if (!gcToken) return res.json(empty);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(todayStart);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  try {
    const [recent, allTime, hits] = await Promise.all([
      gcFetch(`/api/v0/stats/total/?start=${weekAgo.toISOString()}&end=${now.toISOString()}`, gcToken),
      gcFetch(`/api/v0/stats/total/?start=2020-01-01T00:00:00Z&end=${now.toISOString()}`, gcToken),
      gcFetch(`/api/v0/stats/hits/?start=${weekAgo.toISOString()}&end=${now.toISOString()}&limit=100&daily=true`, gcToken),
    ]);

    const todayStr = todayStart.toISOString().split('T')[0];
    const yd = new Date(todayStart);
    yd.setUTCDate(yd.getUTCDate() - 1);
    const stats = recent?.stats || [];

    // Post paths from GoatCounter
    const rawPosts = (hits?.hits || [])
      .filter((h) => h.path && decodeURIComponent(h.path).startsWith('/post/'))
      .slice(0, 5);

    // Book slugs from GoatCounter
    const bookMap = {};
    (hits?.hits || [])
      .filter((h) => h.path && decodeURIComponent(h.path).match(/^\/book\/[^/]+/))
      .forEach((h) => {
        const decoded = decodeURIComponent(h.path);
        const slug = decoded.match(/^\/book\/([^/]+)/)[1];
        if (!bookMap[slug]) bookMap[slug] = { slug, count: 0 };
        bookMap[slug].count += h.count;
      });
    const rawBooks = Object.values(bookMap).sort((a, b) => b.count - a.count).slice(0, 3);

    // Resolve titles/covers from GitHub in parallel
    const [topPosts, topBooks] = await Promise.all([
      Promise.all(
        rawPosts.map(async (h) => {
          const decoded = decodeURIComponent(h.path);
          const m = decoded.match(/^\/post\/([^/]+)\/([^/]+)$/);
          if (!m) return null;
          const title = await resolvePostTitle(m[1], m[2], ghOwner, ghRepo, ghToken);
          return { path: decoded, title, count: h.count };
        }),
      ),
      Promise.all(
        rawBooks.map(async (b) => {
          const info = await resolveBookInfo(b.slug, ghOwner, ghRepo, booksPath, ghToken);
          return { slug: b.slug, title: info.title, cover: info.cover, count: b.count };
        }),
      ),
    ]);

    res.json({
      visitors: {
        today: stats.find((s) => s.day === todayStr)?.daily || 0,
        yesterday: stats.find((s) => s.day === yd.toISOString().split('T')[0])?.daily || 0,
        total: allTime?.total || 0,
      },
      topPosts: topPosts.filter(Boolean),
      topBooks,
    });
  } catch {
    res.json(empty);
  }
}
