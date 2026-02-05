import { create } from 'zustand';
import { fetchBookList, fetchBookDetail, fetchChapter, fetchDiscussionCounts } from '../api/github';

const useBookStore = create((set, get) => ({
  books: [],
  currentBook: null,
  currentChapter: null,
  loading: false,
  error: null,
  selectedCategory: 'all',
  searchQuery: '',

  loadBooks: async () => {
    if (get().books.length > 0) return;
    set({ loading: true, error: null });
    try {
      const books = await fetchBookList();
      set({ books, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  loadBook: async (slug) => {
    const cached = get().currentBook;
    if (cached && cached.slug === slug) return;
    set({ loading: true, error: null, currentBook: null });
    try {
      const [book, commentCounts] = await Promise.all([
        fetchBookDetail(slug),
        fetchDiscussionCounts(slug),
      ]);
      book.commentCounts = commentCounts;
      set({ currentBook: book, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  loadChapter: async (bookSlug, chapterPath) => {
    set({ loading: true, error: null, currentChapter: null });
    try {
      const chapter = await fetchChapter(bookSlug, chapterPath);
      set({ currentChapter: chapter, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  setCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearBook: () => set({ currentBook: null }),
  clearChapter: () => set({ currentChapter: null }),

  refreshBooks: () => {
    set({ books: [] });
    get().loadBooks();
  },

  getFilteredBooks: () => {
    const { books, selectedCategory, searchQuery } = get();
    return books.filter((book) => {
      const matchCategory =
        selectedCategory === 'all' || book.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (book.title || '').toLowerCase().includes(q) ||
        (book.author || '').toLowerCase().includes(q) ||
        (book.tags || []).some((tag) => tag.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  },

  getCategories: () => {
    const { books } = get();
    const categories = [
      ...new Set(books.map((b) => b.category).filter(Boolean)),
    ];
    return ['all', ...categories.sort()];
  },
}));

export default useBookStore;
