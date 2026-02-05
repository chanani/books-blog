import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiStar, FiChevronRight, FiMessageSquare } from 'react-icons/fi';
import useBookStore from '../../store/useBookStore';
import './Book.css';

function Book() {
  const { bookSlug } = useParams();
  const navigate = useNavigate();
  const { currentBook, loading, error, loadBook, clearBook } = useBookStore();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    loadBook(bookSlug);
    return () => clearBook();
  }, [bookSlug, loadBook, clearBook]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        size={15}
        className={i < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  if (loading) {
    return (
      <main className="book-page">
        <div className="book-wrap">
          <div className="book-status">
            <div className="loader" />
          </div>
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

  const folderNames = Object.keys(currentBook.folderGroups || {});
  const commentCounts = currentBook.commentCounts || {};

  return (
    <main className="book-page">
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
          <h2 className="section-title">
            목차
            <span className="chapter-count">{currentBook.totalChapters}</span>
          </h2>

          {currentBook.rootChapters?.length > 0 && (
            <div className="chapter-group">
              {currentBook.rootChapters.map((ch) => (
                <Link
                  key={ch.path}
                  to={`/book/${bookSlug}/read/${ch.path}`}
                  className="chapter-item"
                >
                  <span className="chapter-name">{ch.name}</span>
                  <div className="chapter-right">
                    {commentCounts[ch.path] > 0 && (
                      <span className="chapter-comments">
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
                {currentBook.folderGroups[folder].map((ch) => (
                  <Link
                    key={ch.path}
                    to={`/book/${bookSlug}/read/${ch.path}`}
                    className="chapter-item"
                  >
                    <span className="chapter-name">{ch.name}</span>
                    <div className="chapter-right">
                      {commentCounts[ch.path] > 0 && (
                        <span className="chapter-comments">
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
        </section>
      </motion.div>
    </main>
  );
}

export default Book;
