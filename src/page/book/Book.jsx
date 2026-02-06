import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiChevronRight, FiMessageSquare, FiSearch } from 'react-icons/fi';
import useBookStore from '../../store/useBookStore';
import './Book.css';

function Book() {
  const { bookSlug } = useParams();
  const navigate = useNavigate();
  const { currentBook, loading, error, loadBook, clearBook } = useBookStore();
  const [imgError, setImgError] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');

  useEffect(() => {
    loadBook(bookSlug);
    return () => clearBook();
  }, [bookSlug, loadBook, clearBook]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => {
      const fill = rating - i >= 1 ? 'full' : rating - i >= 0.5 ? 'half' : 'empty';
      return (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" className={`star-${fill}`}>
          <defs>
            <clipPath id={`half-b-${i}`}>
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>
          {fill === 'half' && (
            <>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" clipPath={`url(#half-b-${i})`} fill="var(--yellow)" stroke="var(--yellow)" strokeWidth="1" />
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="var(--yellow)" strokeWidth="1" />
            </>
          )}
          {fill === 'full' && (
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="var(--yellow)" stroke="var(--yellow)" strokeWidth="1" />
          )}
          {fill === 'empty' && (
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="var(--border-color)" strokeWidth="1" />
          )}
        </svg>
      );
    });
  };

  if (loading) {
    return (
      <main className="book-page">
        <div className="page-loading">
          <div className="loader-lg" />
          <p className="loading-text">책 정보를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="book-page">
        <div className="book-wrap">
          <div className="book-status">
            <p className="status-msg">책 정보를 불러오지 못했습니다</p>
            <p className="status-detail">{error}</p>
            <button className="status-btn" onClick={() => navigate('/')}>
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!currentBook) return null;

  const commentCounts = currentBook.commentCounts || {};
  const searchQuery = chapterSearch.toLowerCase().trim();

  const filteredRootChapters = (currentBook.rootChapters || []).filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery)
  );

  const filteredFolderGroups = Object.entries(currentBook.folderGroups || {}).reduce(
    (acc, [folder, chapters]) => {
      const filtered = chapters.filter((ch) =>
        ch.name.toLowerCase().includes(searchQuery)
      );
      if (filtered.length > 0) {
        acc[folder] = filtered;
      }
      return acc;
    },
    {}
  );

  const folderNames = Object.keys(filteredFolderGroups);
  const hasResults = filteredRootChapters.length > 0 || folderNames.length > 0;

  return (
    <main className="book-page">
      <Helmet>
        <title>{currentBook.title} - 차나니의 책방</title>
        <meta name="description" content={`${currentBook.title} 독서 기록`} />
        <meta property="og:title" content={`${currentBook.title} - 차나니의 책방`} />
        <meta property="og:description" content={`${currentBook.title} 독서 기록`} />
        {currentBook.cover && <meta property="og:image" content={currentBook.cover} />}
      </Helmet>
      <motion.div
        className="book-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button className="back-link" onClick={() => navigate('/')}>
          <FiArrowLeft size={16} />
          <span>돌아가기</span>
        </button>

        {/* Book Info Section */}
        <section className="book-info-section">
          <div className="book-cover-lg">
            {currentBook.cover && !imgError ? (
              <img
                src={currentBook.cover}
                alt={currentBook.title}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="cover-fallback-lg">
                <span>&#128214;</span>
              </div>
            )}
          </div>

          <div className="book-info-detail">
            <h1 className="info-title">{currentBook.title}</h1>
            {currentBook.subtitle && (
              <p className="info-subtitle">{currentBook.subtitle}</p>
            )}
            <div className="info-author-row">
              {currentBook.author && (
                <span className="info-author">{currentBook.author}</span>
              )}
              {currentBook.category && (
                <span className="info-category">{currentBook.category}</span>
              )}
            </div>
            {currentBook.rating > 0 && (
              <div className="info-rating">
                {renderStars(currentBook.rating)}
              </div>
            )}

            <div className="info-metas">
              {currentBook.publisher && (
                <div className="info-meta-row">
                  <span className="meta-label">출판사</span>
                  <span className="meta-value">{currentBook.publisher}</span>
                </div>
              )}
              {currentBook.totalPages && (
                <div className="info-meta-row">
                  <span className="meta-label">쪽수</span>
                  <span className="meta-value">{currentBook.totalPages}쪽</span>
                </div>
              )}
            </div>

            {currentBook.tags && currentBook.tags.length > 0 && (
              <div className="info-tags">
                {currentBook.tags.map((tag) => (
                  <span key={tag} className="info-tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Chapter List */}
        <section className="chapter-section">
          <div className="chapter-section-header">
            <h2 className="section-title">
              목차
              <span className="chapter-count">{currentBook.totalChapters}</span>
            </h2>
            {currentBook.totalChapters > 0 && (
              <div className="chapter-search">
                <FiSearch size={14} className="chapter-search-icon" />
                <input
                  type="text"
                  placeholder="챕터 검색..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className="chapter-search-input"
                />
              </div>
            )}
          </div>

          {filteredRootChapters.length > 0 && (
            <div className="chapter-group">
              {filteredRootChapters.map((ch) => (
                <Link
                  key={ch.path}
                  to={`/book/${bookSlug}/read/${ch.path}`}
                  className="chapter-item"
                >
                  <span className="chapter-name">{ch.name}</span>
                  <div className="chapter-right">
                    {commentCounts[ch.path] > 0 && (
                      <span className="comment-count">
                        <FiMessageSquare size={12} />
                        {commentCounts[ch.path]}
                      </span>
                    )}
                    <FiChevronRight size={16} className="chapter-arrow" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {folderNames.map((folder) => (
            <div key={folder}>
              <h3 className="folder-title">{folder}</h3>
              <div className="chapter-group">
                {filteredFolderGroups[folder].map((ch) => (
                  <Link
                    key={ch.path}
                    to={`/book/${bookSlug}/read/${ch.path}`}
                    className="chapter-item"
                  >
                    <span className="chapter-name">{ch.name}</span>
                    <div className="chapter-right">
                      {commentCounts[ch.path] > 0 && (
                        <span className="comment-count">
                          <FiMessageSquare size={12} />
                          {commentCounts[ch.path]}
                        </span>
                      )}
                      <FiChevronRight size={16} className="chapter-arrow" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {currentBook.totalChapters === 0 && (
            <p className="no-chapters">아직 작성된 챕터가 없습니다.</p>
          )}

          {currentBook.totalChapters > 0 && !hasResults && (
            <p className="no-chapters">검색 결과가 없습니다.</p>
          )}
        </section>
      </motion.div>
    </main>
  );
}

export default Book;
