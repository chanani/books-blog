export async function fetchViewCount(path) {
  try {
    const res = await fetch(`/api/views?path=${encodeURIComponent(path)}`);
    if (!res.ok) return "0";
    const data = await res.json();
    return data.count ?? "0";
  } catch {
    return "0";
  }
}

export async function fetchViewCountBatch(paths) {
  try {
    const res = await fetch('/api/views-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
