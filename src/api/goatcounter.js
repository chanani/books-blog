export async function fetchViewCount(path) {
  try {
    const res = await fetch(
      `/gc/counter/${encodeURIComponent(path)}.json`,
    );
    if (!res.ok) return "0";
    const data = await res.json();
    return data.count;
  } catch {
    return "0";
  }
}
