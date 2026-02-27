const GC_BASE = 'https://chanani.goatcounter.com';

async function gcFetch(path, token) {
  try {
    const res = await fetch(`${GC_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function verifyPassword(authHeader) {
  if (!authHeader) return false;
  const password = authHeader.replace('Bearer ', '');
  return password === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!verifyPassword(authHeader)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  const gcToken = process.env.GOATCOUNTER_API_TOKEN;
  const ghToken = process.env.VITE_GITHUB_TOKEN;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(todayStart);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const threeMonthsAgo = new Date(todayStart);
  threeMonthsAgo.setUTCDate(threeMonthsAgo.getUTCDate() - 90);

  const qs = (start, end) => `start=${start.toISOString()}&end=${end.toISOString()}`;
  const recentRange = qs(weekAgo, now);
  const longRange = qs(threeMonthsAgo, now);

  try {
    const [recent, allTime, hits, browsers, systems, locations, languages, rateLimit] = await Promise.all([
      gcToken ? gcFetch(`/api/v0/stats/total/?${recentRange}`, gcToken) : null,
      gcToken ? gcFetch(`/api/v0/stats/total/?start=2020-01-01T00:00:00Z&end=${now.toISOString()}`, gcToken) : null,
      gcToken ? gcFetch(`/api/v0/stats/hits/?${longRange}&limit=20&daily=true`, gcToken) : null,
      gcToken ? gcFetch(`/api/v0/stats/browsers/?${longRange}&limit=10`, gcToken) : null,
      gcToken ? gcFetch(`/api/v0/stats/systems/?${longRange}&limit=10`, gcToken) : null,
      gcToken ? gcFetch(`/api/v0/stats/locations/?${longRange}&limit=10`, gcToken) : null,
      gcToken ? gcFetch(`/api/v0/stats/languages/?${longRange}&limit=10`, gcToken) : null,
      ghToken
        ? fetch('https://api.github.com/rate_limit', {
            headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3+json' },
          }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
        : null,
    ]);

    const todayStr = todayStart.toISOString().split('T')[0];
    const yd = new Date(todayStart);
    yd.setUTCDate(yd.getUTCDate() - 1);
    const recentStats = recent?.stats || [];

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      visitors: {
        today: recentStats.find((s) => s.day === todayStr)?.daily || 0,
        yesterday: recentStats.find((s) => s.day === yd.toISOString().split('T')[0])?.daily || 0,
        total: allTime?.total || 0,
      },
      hits: hits?.hits || [],
      browsers: browsers?.stats || [],
      systems: systems?.stats || [],
      locations: locations?.stats || [],
      languages: languages?.stats || [],
      rateLimit: rateLimit?.resources?.core || null,
    }));
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
