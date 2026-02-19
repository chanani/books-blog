import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';
import './BookCard.css';

function BookCard({ book, index }) {
  const [imgError, setImgError] = useState(false);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => {
      const fill = rating - i >= 1 ? 'full' : rating - i >= 0.5 ? 'half' : 'empty';
      return (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" className={`star-${fill}`}>
          <defs>
            <clipPath id={`half-${i}`}>
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>
          {fill === 'half' && (
            <>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" clipPath={`url(#half-${i})`} fill="var(--yellow)" stroke="var(--yellow)" strokeWidth="1" />
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link to={`/book/${book.slug}`} className="book-card">
        <div className="book-cover-wrap">
          {book.cover && !imgError ? (
            <img
              src={book.cover}
              alt={book.title}
              className="book-cover-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="book-cover-fallback">
              <span className="fallback-emoji">&#128214;</span>
            </div>
          )}
        </div>

        <div className="book-card-info">
          <div className="book-title-row">
            <h3 className="book-title">{book.title}</h3>
            {book.status && (
              <span className={`book-status-badge status-${book.status}`}>
                {book.status}
              </span>
            )}
          </div>
          {book.subtitle && (
            <p className="book-subtitle">{book.subtitle}</p>
          )}

          <div className="book-meta">
            {book.author && <span>{book.author}</span>}
            {book.author && book.date && <span className="dot">&middot;</span>}
            {book.category && (
              <>
                <span className="dot">&middot;</span>
                <span className="book-category">{book.category}</span>
              </>
            )}
          </div>

          {book.rating > 0 && (
            <div className="book-rating">{renderStars(book.rating)}</div>
          )}

          {book.tags && book.tags.length > 0 && (
            <div className="book-tags">
              {book.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="book-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        <FiChevronRight size={18} className="book-arrow" />
      </Link>
    </motion.div>
  );
}

export default BookCard;
