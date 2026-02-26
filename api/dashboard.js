const GC_BASE = 'https://chanani.goatcounter.com';

async function fetchGC(path, token) {
  const res = await fetch(`${GC_BASE}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function handler(req, res) {
  const token = process.env.GOATCOUNTER_API_TOKEN;
  const empty = { visitors: { today: 0, yesterday: 0, total: 0 }, topPosts: [], topBooks: [] };

  if (!token) return res.json(empty);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const weekAgo = new Date(todayStart);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  try {
    const [recent, allTime, hits] = await Promise.all([
      fetchGC(`/api/v0/stats/total/?start=${weekAgo.toISOString()}&end=${now.toISOString()}`, token),
      fetchGC(`/api/v0/stats/total/?start=2020-01-01T00:00:00Z&end=${now.toISOString()}`, token),
      fetchGC(`/api/v0/stats/hits/?start=${weekAgo.toISOString()}&end=${now.toISOString()}&limit=100&daily=true`, token),
    ]);

    const todayStr = todayStart.toISOString().split('T')[0];
    const yesterday = new Date(todayStart);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const stats = recent?.stats || [];
    const todayCount = stats.find((s) => s.day === todayStr)?.daily || 0;
    const yesterdayCount = stats.find((s) => s.day === yesterdayStr)?.daily || 0;

    const topPosts = (hits?.hits || [])
      .filter((h) => h.path && decodeURIComponent(h.path).startsWith('/post/'))
      .slice(0, 10)
      .map((h) => ({ path: decodeURIComponent(h.path), title: h.title || decodeURIComponent(h.path), count: h.count }));

    const bookMap = {};
    (hits?.hits || [])
      .filter((h) => h.path && decodeURIComponent(h.path).match(/^\/book\/[^/]+/))
      .forEach((h) => {
        const decoded = decodeURIComponent(h.path);
        const slug = decoded.match(/^\/book\/([^/]+)/)[1];
        if (!bookMap[slug]) bookMap[slug] = { slug, title: '', count: 0 };
        bookMap[slug].count += h.count;
        if (!bookMap[slug].title || decoded === `/book/${slug}`) {
          bookMap[slug].title = h.title || slug;
        }
      });

    const topBooks = Object.values(bookMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    res.json({
      visitors: { today: todayCount, yesterday: yesterdayCount, total: allTime?.total || 0 },
      topPosts,
      topBooks,
    });
  } catch {
    res.json(empty);
  }
}
