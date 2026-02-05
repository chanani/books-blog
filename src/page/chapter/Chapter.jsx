import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiArrowLeft, FiCalendar, FiEdit3 } from 'react-icons/fi';
import Giscus from '@giscus/react';
import useBookStore from '../../store/useBookStore';
import './Chapter.css';

function Chapter() {
  const { bookSlug, '*': chapterPath } = useParams();
  const navigate = useNavigate();
  const { currentChapter, loading, error, loadChapter, clearChapter } =
    useBookStore();
  const [giscusTheme, setGiscusTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  useEffect(() => {
    if (chapterPath) {
      loadChapter(bookSlug, chapterPath);
    }
    return () => clearChapter();
  }, [bookSlug, chapterPath, loadChapter, clearChapter]);

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

  if (loading) {
    return (
      <main className="chapter-page">
        <div className="chapter-wrap">
          <div className="chapter-status">
            <div className="loader" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="chapter-page">
        <div className="chapter-wrap">
          <div className="chapter-status">
            <p className="status-msg">챕터를 불러오지 못했습니다</p>
            <p className="status-detail">{error}</p>
            <button
              className="status-btn"
              onClick={() => navigate(`/book/${bookSlug}`)}
            >
              책으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!currentChapter) return null;

  return (
    <main className="chapter-page">
      <motion.div
        className="chapter-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button
          className="back-link"
          onClick={() => navigate(`/book/${bookSlug}`)}
        >
          <FiArrowLeft size={16} />
          <span>책으로 돌아가기</span>
        </button>

        <article className="chapter-article">
          <header className="chapter-header">
            <h1 className="chapter-title">{currentChapter.title}</h1>
            {(currentChapter.createdAt || currentChapter.updatedAt) && (
              <div className="chapter-dates">
                {currentChapter.createdAt && (
                  <span className="chapter-date-item">
                    <FiCalendar size={13} />
                    작성 {currentChapter.createdAt}
                  </span>
                )}
                {currentChapter.updatedAt &&
                  currentChapter.updatedAt !== currentChapter.createdAt && (
                    <span className="chapter-date-item">
                      <FiEdit3 size={13} />
                      수정 {currentChapter.updatedAt}
                    </span>
                  )}
              </div>
            )}
          </header>

          <div className="chapter-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneLight}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        background: '#f2f4f6',
                        border: 'none',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {currentChapter.content}
            </ReactMarkdown>
          </div>
        </article>

        <section className="chapter-comments">
          <Giscus
            repo="chanani/books-blog"
            repoId="R_kgDORI3Ksw"
            category="Announcements"
            categoryId="DIC_kwDORI3Ks84C15da"
            mapping="specific"
            term={`book/${bookSlug}/read/${chapterPath}`}
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="top"
            theme={giscusTheme}
            lang="ko"
          />
        </section>
      </motion.div>
    </main>
  );
}

export default Chapter;
