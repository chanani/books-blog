import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiBookOpen, FiEye, FiAward, FiEdit3, FiBook } from 'react-icons/fi';
import { fetchDashboardStats } from '../../api/dashboard';
import './Dashboard.css';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
});

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
  const heroPost = topPosts[0];
  const restPosts = topPosts.slice(1);

  return (
    <main className="dashboard">
      <Helmet>
        <title>차나니의 블로그</title>
        <meta name="description" content="차나니의 블로그 - 개발 기술 블로그 & 독서 기록" />
        <meta property="og:title" content="차나니의 블로그" />
        <meta property="og:description" content="개발 기술 블로그 & 독서 기록" />
        <link rel="canonical" href="https://chanani-books.vercel.app/" />
      </Helmet>

      {loading && (
        <div className="home-loading">
          <div className="loader-lg" />
        </div>
      )}

      {!loading && topPosts.length === 0 && topBooks.length === 0 && (
        <p className="home-empty">아직 데이터가 없습니다.</p>
      )}

      {!loading && (topPosts.length > 0 || topBooks.length > 0) && (
        <div className="home-layout">
          {/* ── Sidebar ── */}
          <aside className="home-sidebar">
            <motion.div className="sidebar-profile" {...fade(0)}>
              <span className="profile-emoji">👨‍💻</span>
              <span className="profile-name">차나니</span>
              <span className="profile-desc">개발 & 독서 기록</span>
            </motion.div>

            <motion.div className="sidebar-visitors" {...fade(0.04)}>
              <div className="sidebar-visitors-title">방문자</div>
              <div className="visitor-rows">
                <div className="visitor-row">
                  <span className="visitor-row-label">Today</span>
                  <span className="visitor-row-num">{v.today.toLocaleString()}</span>
                </div>
                <div className="visitor-row">
                  <span className="visitor-row-label">Yesterday</span>
                  <span className="visitor-row-num">{v.yesterday.toLocaleString()}</span>
                </div>
                <div className="visitor-row">
                  <span className="visitor-row-label">Total</span>
                  <span className="visitor-row-num">{v.total.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>

            <motion.div className="sidebar-links" {...fade(0.08)}>
              <Link to="/posts" className="sidebar-link">
                <FiEdit3 size={14} />
                개발 글
              </Link>
              <Link to="/books" className="sidebar-link">
                <FiBook size={14} />
                책방
              </Link>
            </motion.div>
          </aside>

          {/* ── Main ── */}
          <div className="home-main">
            {/* 인기 글 Section */}
            {topPosts.length > 0 && (
              <motion.section {...fade(0.06)}>
                <div className="section-head">
                  <h2 className="section-title">
                    <FiAward size={16} />
                    인기 글
                  </h2>
                  <Link to="/posts" className="section-more">더보기 →</Link>
                </div>

                {heroPost && (
                  <Link to={heroPost.path} className="featured-post">
                    <span className="featured-badge">
                      <FiAward size={11} />
                      TOP 1
                    </span>
                    <h3 className="featured-title">{heroPost.title}</h3>
                    <span className="featured-views">
                      <FiEye size={13} />
                      {heroPost.count?.toLocaleString() || 0} views
                    </span>
                  </Link>
                )}

                {restPosts.length > 0 && (
                  <div className="post-card-grid">
                    {restPosts.map((post, i) => (
                      <Link key={post.path} to={post.path} className="post-card-item">
                        <span className={`post-card-rank ${i < 2 ? 'accent' : 'muted'}`}>
                          {i + 2}
                        </span>
                        <p className="post-card-name">{post.title}</p>
                        <span className="post-card-count">
                          <FiEye size={11} />
                          {post.count?.toLocaleString() || 0}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* 인기 도서 Section */}
            {topBooks.length > 0 && (
              <motion.section {...fade(0.12)}>
                <div className="section-head">
                  <h2 className="section-title">
                    <FiBookOpen size={16} />
                    인기 도서
                  </h2>
                  <Link to="/books" className="section-more">더보기 →</Link>
                </div>

                <div className="dash-book-grid">
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
                            <FiBookOpen size={28} />
                          </div>
                        )}
                      </div>
                      <div className="dash-book-info">
                        <span className="dash-book-title">{book.title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default Dashboard;
