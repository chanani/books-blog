import { useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import useBookStore from '../../store/useBookStore';
import BookCard from './_components/BookCard';
import CategoryFilter from './_components/CategoryFilter';
import './Home.css';

function Home() {
  const {
    loading,
    error,
    selectedCategory,
    searchQuery,
    loadBooks,
    setCategory,
    setSearchQuery,
    getFilteredBooks,
    getCategories,
    refreshBooks,
  } = useBookStore();

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filteredBooks = getFilteredBooks();
  const categories = getCategories();

  return (
    <main className="home">
      <section className="home-content">
        <div className="search-wrap">
          <FiSearch size={18} className="search-icon" />
          <input
            type="text"
            placeholder="제목, 저자, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {categories.length > 1 && (
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setCategory}
          />
        )}

        {loading && (
          <div className="page-loading">
            <div className="loader-lg" />
            <p className="loading-text">책 목록을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="home-status">
            <p className="status-msg">책 목록을 불러오지 못했습니다</p>
            <p className="status-detail">{error}</p>
            <button className="status-btn" onClick={refreshBooks}>
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && filteredBooks.length === 0 && (
          <div className="home-status">
            <p className="status-msg">
              {searchQuery || selectedCategory !== 'all'
                ? '검색 결과가 없습니다.'
                : '아직 등록된 책이 없습니다.'}
            </p>
          </div>
        )}

        {!loading && filteredBooks.length > 0 && (
          <div className="book-list">
            {filteredBooks.map((book, index) => (
              <BookCard key={book.slug} book={book} index={index} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;
