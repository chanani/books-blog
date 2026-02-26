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
