import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiBookOpen } from 'react-icons/fi';
import { fetchDashboardStats } from '../../api/dashboard';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const v = stats?.visitors || { today: 0, yesterday: 0, total: 0 };
  const topPosts = stats?.topPosts || [];
  const topBooks = stats?.topBooks || [];

  return (
    <main className="dashboard">
      <Helmet>
        <title>차나니의 블로그</title>
        <meta name="description" content="차나니의 블로그 - 개발 기술 블로그 & 독서 기록" />
        <meta property="og:title" content="차나니의 블로그" />
        <meta property="og:description" content="개발 기술 블로그 & 독서 기록" />
        <link rel="canonical" href="https://chanani-books.vercel.app/" />
      </Helmet>

      {/* ── Visitor Stats ── */}
      <motion.section
        className="visitor-bar"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="visitor-item">
          <span className="visitor-label">오늘</span>
          <span className="visitor-count">{loading ? '-' : v.today.toLocaleString()}</span>
        </div>
        <div className="visitor-divider" />
        <div className="visitor-item">
          <span className="visitor-label">어제</span>
          <span className="visitor-count">{loading ? '-' : v.yesterday.toLocaleString()}</span>
        </div>
        <div className="visitor-divider" />
        <div className="visitor-item">
          <span className="visitor-label">누적</span>
          <span className="visitor-count">{loading ? '-' : v.total.toLocaleString()}</span>
        </div>
      </motion.section>

      <div className="dash-grid">
        {/* ── 인기 글 TOP 5 ── */}
        <motion.section
          className="dash-card dash-posts"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <div className="dash-card-header">
            <FiTrendingUp size={15} />
            <h2>인기 글</h2>
          </div>

          {loading && (
            <div className="dash-loading">
              <div className="loader-lg" />
            </div>
          )}

          {!loading && topPosts.length === 0 && (
            <p className="dash-empty">아직 데이터가 없습니다.</p>
          )}

          {!loading && topPosts.length > 0 && (
            <ol className="rank-list">
              {topPosts.map((post, i) => (
                <li key={post.path}>
                  <Link to={post.path} className="rank-item">
                    <span className={`rank-num${i < 3 ? ' top' : ''}`}>{i + 1}</span>
                    <span className="rank-title">{post.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </motion.section>

        {/* ── 인기 도서 TOP 3 ── */}
        <motion.section
          className="dash-card dash-books"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
        >
          <div className="dash-card-header">
            <FiBookOpen size={15} />
            <h2>인기 도서</h2>
          </div>

          {loading && (
            <div className="dash-loading">
              <div className="loader-lg" />
            </div>
          )}

          {!loading && topBooks.length === 0 && (
            <p className="dash-empty">아직 데이터가 없습니다.</p>
          )}

          {!loading && topBooks.length > 0 && (
            <div className="dash-book-shelf">
              {topBooks.map((book) => (
                <Link
                  key={book.slug}
                  to={`/book/${book.slug}`}
                  className="dash-book-card"
                >
                  <div className="dash-book-cover">
                    {book.cover ? (
                      <img src={book.cover} alt={book.title} className="dash-book-img" />
                    ) : (
                      <div className="dash-book-placeholder">
                        <FiBookOpen size={24} />
                      </div>
                    )}
                  </div>
                  <span className="dash-book-title">{book.title}</span>
                </Link>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}

export default Dashboard;
