import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiArrowLeft, FiCalendar, FiEdit3, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Giscus from '@giscus/react';
import useBookStore from '../../store/useBookStore';
import './Chapter.css';

const GITHUB_RAW = `https://raw.githubusercontent.com/${import.meta.env.VITE_GITHUB_OWNER}/${import.meta.env.VITE_GITHUB_REPO}/master`;
const BOOKS_PATH = import.meta.env.VITE_GITHUB_PATH || 'books';

function resolveImageSrc(src, bookSlug, chapterPath) {
  if (!src || /^https?:\/\//.test(src)) return src;
  // 챕터 파일의 디렉토리 기준으로 상대경로 해석
  const chapterDir = `${BOOKS_PATH}/${bookSlug}/${chapterPath}`.split('/').slice(0, -1);
  const parts = src.split('/');
  for (const part of parts) {
    if (part === '..') chapterDir.pop();
    else if (part !== '.') chapterDir.push(part);
  }
  return `${GITHUB_RAW}/${chapterDir.join('/')}`;
}

function Chapter() {
  const { bookSlug, '*': chapterPath } = useParams();
  const navigate = useNavigate();
  const { currentChapter, loading, error, loadChapter, clearChapter, getChapterNav } =
    useBookStore();
  const { prev, next } = getChapterNav(chapterPath);
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
                img({ src, alt, ...props }) {
                  return (
                    <img
                      src={resolveImageSrc(src, bookSlug, chapterPath)}
                      alt={alt}
                      {...props}
                    />
                  );
                },
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={giscusTheme === 'dark' ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        borderRadius: '6px',
                        fontSize: '0.85rem',
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

        {(prev || next) && (
          <nav className={`chapter-nav${prev && next ? ' has-both' : ''}`}>
            {prev && (
              <button
                className="chapter-nav-btn prev"
                onClick={() => navigate(`/book/${bookSlug}/read/${prev.path}`)}
              >
                <FiChevronLeft size={18} />
                <div className="chapter-nav-text">
                  <span className="chapter-nav-label">이전</span>
                  <span className="chapter-nav-title">{prev.name}</span>
                </div>
              </button>
            )}
            {next && (
              <button
                className="chapter-nav-btn next"
                onClick={() => navigate(`/book/${bookSlug}/read/${next.path}`)}
              >
                <div className="chapter-nav-text">
                  <span className="chapter-nav-label">다음</span>
                  <span className="chapter-nav-title">{next.name}</span>
                </div>
                <FiChevronRight size={18} />
              </button>
            )}
          </nav>
        )}

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
