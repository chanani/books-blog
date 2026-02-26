export default async function handler(req, res) {
  const path = req.query.path;
  if (!path) {
    res.json({ count: '0' });
    return;
  }

  const browserPath = encodeURI(path);
  const url = `https://chanani.goatcounter.com/counter/${encodeURIComponent(browserPath)}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      res.json({ count: '0' });
      return;
    }
    const data = await response.json();
    res.json(data);
  } catch {
    res.json({ count: '0' });
  }
}
