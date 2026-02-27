import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Giscus from '@giscus/react';
import './Guestbook.css';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function Guestbook() {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [giscusTheme, setGiscusTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light',
  );

  const fetchComments = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guestbook?page=${p}`);
      const data = await res.json();
      setComments(data.comments || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 0);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme') || 'light';
      setGiscusTheme(t);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <main className="guestbook">
      <Helmet>
        <title>방명록 - 차나니의 블로그</title>
        <meta name="description" content="차나니의 블로그 방명록입니다. 자유롭게 글을 남겨주세요." />
        <meta property="og:title" content="방명록 - 차나니의 블로그" />
        <meta property="og:description" content="차나니의 블로그 방명록입니다. 자유롭게 글을 남겨주세요." />
        <link rel="canonical" href="https://chanani-books.vercel.app/guestbook" />
      </Helmet>

      <motion.div
        className="guestbook-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="guestbook-intro">
          <h1 className="guestbook-title">방명록</h1>
          <p className="guestbook-desc">자유롭게 글을 남겨주세요 👋</p>
        </div>

        <section className="guestbook-input">
          <Giscus
            repo="chanani/books-blog"
            repoId="R_kgDORI3Ksw"
            category="Announcements"
            categoryId="DIC_kwDORI3Ks84C15da"
            mapping="specific"
            term="guestbook"
            reactionsEnabled="0"
            emitMetadata="0"
            inputPosition="bottom"
            theme={`https://chanani-books.vercel.app/giscus-${giscusTheme}.css?v=2`}
            lang="ko"
          />
        </section>

        <section className="guestbook-list">
          {loading && <p className="gb-status">댓글을 불러오는 중...</p>}

          {!loading && comments.length === 0 && (
            <p className="gb-status">아직 방명록이 없습니다.</p>
          )}

          {!loading && comments.map((c, i) => (
            <div key={`${c.author}-${c.createdAt}-${i}`} className="gb-comment">
              <img src={c.avatar} alt={c.author} className="gb-comment-avatar" />
              <div className="gb-comment-content">
                <div className="gb-comment-header">
                  <span className="gb-comment-author">{c.author}</span>
                  <span className="gb-comment-date">{formatDate(c.createdAt)}</span>
                </div>
                <p className="gb-comment-body">{c.body}</p>
              </div>
            </div>
          ))}

          {!loading && totalPages > 1 && (
            <div className="gb-pagination">
              <button
                className="gb-page-btn"
                disabled={page <= 1}
                onClick={() => fetchComments(page - 1)}
              >
                ← 이전
              </button>
              <span className="gb-page-info">{page} / {totalPages}</span>
              <button
                className="gb-page-btn"
                disabled={page >= totalPages}
                onClick={() => fetchComments(page + 1)}
              >
                다음 →
              </button>
            </div>
          )}
        </section>
      </motion.div>
    </main>
  );
}

export default Guestbook;
