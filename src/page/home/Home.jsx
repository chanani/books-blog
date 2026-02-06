import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiBookOpen, FiX } from 'react-icons/fi';
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

  const [readingHistory, setReadingHistory] = useState([]);

  useEffect(() => {
    loadBooks();
    const history = JSON.parse(localStorage.getItem('reading-history') || '[]');
    setReadingHistory(history);
  }, [loadBooks]);

  const removeHistoryItem = (e, bookSlug, chapterPath) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = readingHistory.filter(
      (h) => !(h.bookSlug === bookSlug && h.chapterPath === chapterPath)
    );
    setReadingHistory(updated);
    localStorage.setItem('reading-history', JSON.stringify(updated));
  };

  const filteredBooks = getFilteredBooks();
  const categories = getCategories();

  return (
    <main className="home">
      <Helmet>
        <title>차나니의 책방</title>
        <meta name="description" content="개발 서적 독서 기록과 정리" />
        <meta property="og:title" content="차나니의 책방" />
        <meta property="og:description" content="개발 서적 독서 기록과 정리" />
      </Helmet>
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

        {readingHistory.length > 0 && (
          <section className="reading-history">
            <h2 className="section-title">
              <FiBookOpen size={16} />
              이어서 읽기
            </h2>
            <div className="history-list">
              {readingHistory.slice(0, 1).map((item) => (
                <div key={`${item.bookSlug}-${item.chapterPath}`} className="history-item">
                  <Link
                    to={`/book/${item.bookSlug}/read/${item.chapterPath}`}
                    className="history-link"
                  >
                    <div className="history-info">
                      <span className="history-book">{item.bookTitle}</span>
                      <span className="history-chapter">{item.chapterTitle}</span>
                    </div>
                    <div className="history-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{item.progress}%</span>
                    </div>
                  </Link>
                  <button
                    className="history-remove"
                    onClick={(e) => removeHistoryItem(e, item.bookSlug, item.chapterPath)}
                    aria-label="기록 삭제"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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
