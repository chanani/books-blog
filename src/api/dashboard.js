export async function fetchDashboardStats() {
  try {
    const res = await fetch('/api/dashboard');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
