import { create } from 'zustand';
import { fetchAllChapterContents } from '../api/github';

const CACHE_KEY = 'search-index';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.index;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCache(index) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ index, timestamp: Date.now() }),
    );
  } catch {
    // localStorage full — ignore
  }
}

const SNIPPET_RADIUS = 30;

function extractSnippet(text, query) {
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return '';

  const start = Math.max(0, idx - SNIPPET_RADIUS);
  const end = Math.min(text.length, idx + query.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return prefix + text.slice(start, end) + suffix;
}

const useSearchStore = create((set, get) => ({
  index: [],
  indexing: false,
  indexReady: false,
  indexProgress: { done: 0, total: 0 },

  loadCachedIndex: () => {
    const cached = loadCache();
    if (cached) {
      set({ index: cached, indexReady: true });
      return true;
    }
    return false;
  },

  buildIndex: async (books) => {
    const { indexing, indexReady } = get();
    if (indexing || indexReady) return;

    set({ indexing: true, indexProgress: { done: 0, total: 0 } });

    const index = await fetchAllChapterContents(books, (done, total) => {
      set({ indexProgress: { done, total } });
    });

    saveCache(index);
    set({ index, indexing: false, indexReady: true });
  },

  searchContent: (query) => {
    if (!query || query.length < 2) return [];

    const { index } = get();
    const qLower = query.toLowerCase();
    const results = [];

    for (const entry of index) {
      if (!entry.plainText.toLowerCase().includes(qLower)) continue;

      results.push({
        bookSlug: entry.bookSlug,
        bookTitle: entry.bookTitle,
        chapterPath: entry.chapterPath,
        chapterName: entry.chapterName,
        snippet: extractSnippet(entry.plainText, query),
      });
    }

    return results.slice(0, 20);
  },
}));

export default useSearchStore;
