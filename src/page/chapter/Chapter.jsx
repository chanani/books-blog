import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiArrowLeft, FiCalendar, FiEdit3, FiChevronLeft, FiChevronRight, FiList, FiMinus, FiPlus, FiSettings, FiLink, FiCheck, FiCopy } from 'react-icons/fi';
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

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="code-block-wrapper">
      <button className="code-copy-btn" onClick={handleCopy} aria-label="코드 복사">
        {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
      </button>
      <SyntaxHighlighter
        style={theme === 'dark' ? oneDark : oneLight}
        language={language}
        PreTag="div"
        customStyle={{
          borderRadius: '6px',
          fontSize: '0.85rem',
          border: 'none',
          margin: 0,
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
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
  const [activeId, setActiveId] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('chapter-font-size');
    return saved ? parseInt(saved, 10) : 16;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const changeFontSize = (delta) => {
    setFontSize((prev) => {
      const next = Math.min(Math.max(prev + delta, 14), 22);
      localStorage.setItem('chapter-font-size', String(next));
      return next;
    });
  };

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
      return !inline && match ? (
        <CodeBlock language={match[1]}>{children}</CodeBlock>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  }), [bookSlug, chapterPath]);

  const saveReadingHistory = useCallback((progress) => {
    if (!currentChapter) return;
    const historyKey = 'reading-history';
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const entry = {
      bookSlug,
      chapterPath,
      chapterTitle: currentChapter.title,
      bookTitle: currentChapter.bookTitle || bookSlug,
      progress: Math.round(progress),
      timestamp: Date.now(),
    };
    const filtered = history.filter(
      (h) => !(h.bookSlug === bookSlug && h.chapterPath === chapterPath)
    );
    filtered.unshift(entry);
    localStorage.setItem(historyKey, JSON.stringify(filtered.slice(0, 10)));
  }, [bookSlug, chapterPath, currentChapter]);

  const handleScroll = useCallback(() => {
    // 읽기 진행률 계산 (chapter-article 기준)
    const article = document.querySelector('.chapter-article');
    let progress = 0;
    if (article) {
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const articleEnd = articleTop + articleHeight - viewportHeight;
      progress = articleEnd > articleTop
        ? Math.min(Math.max((scrollTop - articleTop) / (articleEnd - articleTop) * 100, 0), 100)
        : 100;
      setReadProgress(progress);
    }

    // 목차 활성 항목 계산
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

  // 읽기 기록 저장 (진행률 변경 시)
  useEffect(() => {
    if (currentChapter && readProgress > 0) {
      saveReadingHistory(readProgress);
    }
  }, [currentChapter, readProgress, saveReadingHistory]);

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
        <div className="page-loading">
          <div className="loader-lg" />
          <p className="loading-text">글을 불러오는 중...</p>
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
      <div className="read-progress-bar" style={{ width: `${readProgress}%` }} />

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
            <div className="chapter-header-top">
              <h1 className="chapter-title">{currentChapter.title}</h1>
              <div className="chapter-settings">
                <button
                  className="settings-btn"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  aria-label="설정"
                >
                  <FiSettings size={18} />
                </button>
                {settingsOpen && (
                  <>
                    <div className="settings-overlay" onClick={() => setSettingsOpen(false)} />
                    <div className="settings-dropdown">
                      <div className="settings-item">
                        <span className="settings-label">글자 크기</span>
                        <div className="font-size-control">
                          <button
                            className="font-size-btn"
                            onClick={() => changeFontSize(-1)}
                            disabled={fontSize <= 14}
                            aria-label="글자 작게"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="font-size-value">{fontSize}</span>
                          <button
                            className="font-size-btn"
                            onClick={() => changeFontSize(1)}
                            disabled={fontSize >= 22}
                            aria-label="글자 크게"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      </div>
                      <button className="settings-copy-btn" onClick={copyUrl}>
                        {copied ? <FiCheck size={14} /> : <FiLink size={14} />}
                        <span>{copied ? '복사됨' : 'URL 복사'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
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

          <div className="chapter-body" style={{ fontSize: `${fontSize}px` }}>
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
