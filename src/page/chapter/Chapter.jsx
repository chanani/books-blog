import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiArrowLeft, FiCalendar, FiEdit3, FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';
import Giscus from '@giscus/react';
import useBookStore from '../../store/useBookStore';
import './Chapter.css';

function extractHeadings(content) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s가-힣-]/g, '')
      .replace(/\s+/g, '-');
    headings.push({ level, text, id });
  }
  return headings;
}

const GITHUB_RAW = `https://raw.githubusercontent.com/${import.meta.env.VITE_GITHUB_OWNER}/${import.meta.env.VITE_GITHUB_REPO}/master`;
const BOOKS_PATH = import.meta.env.VITE_GITHUB_PATH || 'books';

function Chapter() {
  const { bookSlug, '*': chapterPath } = useParams();
  const navigate = useNavigate();
  const { currentChapter, loading, error, loadChapter, clearChapter, getChapterNav } =
    useBookStore();
  const { prev, next } = getChapterNav(chapterPath);
  const [giscusTheme, setGiscusTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );
  const [activeId, setActiveId] = useState('');
  const [tocOpen, setTocOpen] = useState(false);

  const headings = useMemo(() => {
    if (!currentChapter?.content) return [];
    return extractHeadings(currentChapter.content);
  }, [currentChapter?.content]);

  const markdownComponents = useMemo(() => ({
    h1({ children, ...props }) {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s가-힣-]/g, '').replace(/\s+/g, '-');
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2({ children, ...props }) {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s가-힣-]/g, '').replace(/\s+/g, '-');
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3({ children, ...props }) {
      const text = String(children);
      const id = text.toLowerCase().replace(/[^\w\s가-힣-]/g, '').replace(/\s+/g, '-');
      return <h3 id={id} {...props}>{children}</h3>;
    },
    img({ src, alt, ...props }) {
      const resolvedSrc = (() => {
        if (!src || /^https?:\/\//.test(src)) return src;
        const chapterDir = `${BOOKS_PATH}/${bookSlug}/${chapterPath}`.split('/').slice(0, -1);
        const parts = src.split('/');
        for (const part of parts) {
          if (part === '..') chapterDir.pop();
          else if (part !== '.') chapterDir.push(part);
        }
        return `${GITHUB_RAW}/${chapterDir.join('/')}`;
      })();
      return <img src={resolvedSrc} alt={alt} {...props} />;
    },
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      return !inline && match ? (
        <SyntaxHighlighter
          style={theme === 'dark' ? oneDark : oneLight}
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
  }), [bookSlug, chapterPath]);

  const handleScroll = useCallback(() => {
    if (headings.length === 0) return;
    const scrollY = window.scrollY + 100;
    let current = '';
    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el && el.offsetTop <= scrollY) {
        current = heading.id;
      }
    }
    setActiveId(current);
  }, [headings]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      setTocOpen(false);
    }
  };

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
      {headings.length > 0 && (
        <>
          <aside className={`toc-sidebar${tocOpen ? ' open' : ''}`}>
            <div className="toc-header">
              <span className="toc-title">목차</span>
            </div>
            <nav className="toc-nav">
              {headings.map((h) => (
                <button
                  key={h.id}
                  className={`toc-item level-${h.level}${activeId === h.id ? ' active' : ''}`}
                  onClick={() => scrollToHeading(h.id)}
                >
                  {h.text}
                </button>
              ))}
            </nav>
          </aside>
          <button
            className="toc-toggle"
            onClick={() => setTocOpen(!tocOpen)}
            aria-label="목차 열기"
          >
            <FiList size={20} />
          </button>
          {tocOpen && <div className="toc-overlay" onClick={() => setTocOpen(false)} />}
        </>
      )}

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
              components={markdownComponents}
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
