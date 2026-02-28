export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { paths } = req.body;
  if (!Array.isArray(paths) || paths.length === 0) {
    res.json({});
    return;
  }

  const results = await Promise.all(
    paths.map(async (path) => {
      const browserPath = encodeURI(path);
      const url = `https://chanani.goatcounter.com/counter/${encodeURIComponent(browserPath)}.json`;
      try {
        const response = await fetch(url);
        if (!response.ok) return [path, '0'];
        const data = await response.json();
        return [path, data.count ?? '0'];
      } catch {
        return [path, '0'];
      }
    }),
  );

  res.json(Object.fromEntries(results));
}
