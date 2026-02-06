import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiChevronRight, FiMessageSquare, FiSearch, FiDownload } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useBookStore from '../../store/useBookStore';
import { fetchChapter } from '../../api/github';
import './Book.css';

function Book() {
  const { bookSlug } = useParams();
  const navigate = useNavigate();
  const { currentBook, loading, error, loadBook, clearBook } = useBookStore();
  const [imgError, setImgError] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });

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

  const downloadAllPdf = async () => {
    if (!currentBook) return;

    // 모든 챕터 경로 수집
    const allChapters = [
      ...(currentBook.rootChapters || []),
      ...Object.values(currentBook.folderGroups || {}).flat(),
    ];

    if (allChapters.length === 0) return;

    setPdfLoading(true);
    setPdfProgress({ current: 0, total: allChapters.length });

    const [domtoimage, { jsPDF }] = await Promise.all([
      import('dom-to-image-more'),
      import('jspdf'),
    ]);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = pdfHeight - margin * 2;

    // 임시 컨테이너 생성
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 700px;
      background: #ffffff;
      color: #1a1a1a;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif;
      font-size: 14px;
      line-height: 1.8;
    `;
    document.body.appendChild(container);

    let isFirstPage = true;

    try {
      for (let i = 0; i < allChapters.length; i++) {
        const ch = allChapters[i];
        setPdfProgress({ current: i + 1, total: allChapters.length });

        // 챕터 내용 가져오기
        const chapterData = await fetchChapter(bookSlug, ch.path);

        // 컨테이너 초기화
        container.innerHTML = '';

        // 챕터 제목
        const title = document.createElement('h1');
        title.textContent = chapterData.title;
        title.style.cssText = `
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 16px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #6366f1;
        `;
        container.appendChild(title);

        // 마크다운 렌더링용 div
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'color: #1a1a1a;';
        container.appendChild(contentDiv);

        // React 마크다운을 HTML로 변환
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(contentDiv);
        await new Promise((resolve) => {
          root.render(
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {chapterData.content}
            </ReactMarkdown>
          );
          setTimeout(resolve, 100);
        });

        // 스타일 적용
        contentDiv.querySelectorAll('*').forEach((el) => {
          el.style.color = '#1a1a1a';
          el.style.backgroundColor = 'transparent';

          if (el.tagName === 'P') {
            if (!el.closest('blockquote')) {
              el.style.marginBottom = '16px';
            } else {
              el.style.margin = '0';
              el.style.padding = '0';
            }
            el.style.lineHeight = '1.8';
          }
          if (el.tagName === 'BR') {
            el.style.display = 'block';
            el.style.marginBottom = '8px';
          }
          if (el.tagName === 'A') {
            el.style.color = '#2563eb';
          }
          if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4') {
            el.style.marginTop = '24px';
            el.style.marginBottom = '12px';
            el.style.fontWeight = '700';
          }
          if (el.tagName === 'PRE') {
            el.style.backgroundColor = '#f5f5f5';
            el.style.padding = '12px';
            el.style.borderRadius = '6px';
            el.style.overflow = 'hidden';
            el.style.marginBottom = '16px';
            el.style.whiteSpace = 'pre-wrap';
            el.style.wordBreak = 'break-word';
          }
          if (el.tagName === 'CODE') {
            el.style.color = '#333';
            if (!el.closest('pre')) {
              el.style.backgroundColor = '#f0f0f0';
              el.style.padding = '2px 6px';
              el.style.borderRadius = '4px';
            }
          }
          if (el.tagName === 'BLOCKQUOTE') {
            el.style.borderLeft = '4px solid #6366f1';
            el.style.padding = '12px 16px';
            el.style.margin = '16px 0';
            el.style.background = '#f5f5f5';
            el.style.color = '#555';
          }
          if (el.tagName === 'UL') {
            el.style.marginBottom = '16px';
            el.style.paddingLeft = '24px';
            el.style.listStyleType = 'disc';
          }
          if (el.tagName === 'OL') {
            el.style.marginBottom = '16px';
            el.style.paddingLeft = '24px';
            el.style.listStyleType = 'decimal';
          }
          if (el.tagName === 'LI') {
            el.style.marginBottom = '8px';
            el.style.display = 'list-item';
          }
          if (el.tagName === 'STRONG' || el.tagName === 'B') {
            el.style.fontWeight = '700';
          }
          if (el.tagName === 'HR') {
            el.style.border = 'none';
            el.style.borderTop = '1px solid #ddd';
            el.style.margin = '24px 0';
          }
          if (el.tagName === 'TABLE') {
            el.style.width = '100%';
            el.style.borderCollapse = 'collapse';
            el.style.marginBottom = '16px';
          }
          if (el.tagName === 'TH' || el.tagName === 'TD') {
            el.style.border = '1px solid #ddd';
            el.style.padding = '8px 12px';
            el.style.textAlign = 'left';
          }
          if (el.tagName === 'TH') {
            el.style.backgroundColor = '#f5f5f5';
            el.style.fontWeight = '600';
          }
          if (el.tagName === 'IMG') {
            el.style.maxWidth = '100%';
          }
        });

        // 렌더링 대기
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 이미지 캡처
        const scale = 4;
        const dataUrl = await domtoimage.toPng(container, {
          quality: 1,
          bgcolor: '#ffffff',
          width: container.offsetWidth * scale,
          height: container.offsetHeight * scale,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          },
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const ratio = contentWidth / container.offsetWidth;
        const scaledHeight = container.offsetHeight * ratio;
        const totalPages = Math.ceil(scaledHeight / contentHeight);

        for (let page = 0; page < totalPages; page++) {
          if (!isFirstPage) pdf.addPage();
          isFirstPage = false;

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const sourceY = page * (contentHeight / ratio) * scale;
          const sourceHeight = (contentHeight / ratio) * scale;

          canvas.width = img.width;
          canvas.height = sourceHeight;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            0, sourceY, img.width, Math.min(sourceHeight, img.height - sourceY),
            0, 0, img.width, Math.min(sourceHeight, img.height - sourceY)
          );

          const pageData = canvas.toDataURL('image/png', 1.0);
          pdf.addImage(pageData, 'PNG', margin, margin, contentWidth, contentHeight);
        }

        root.unmount();
      }

      pdf.save(`${currentBook.title}.pdf`);
    } finally {
      document.body.removeChild(container);
      setPdfLoading(false);
      setPdfProgress({ current: 0, total: 0 });
    }
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
            <div className="chapter-header-actions">
              {currentBook.totalChapters > 0 && (
                <>
                  <button
                    className="pdf-download-btn"
                    onClick={downloadAllPdf}
                    disabled={pdfLoading}
                  >
                    <FiDownload size={14} />
                    <span>전체 PDF</span>
                  </button>
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
                </>
              )}
            </div>
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

      {pdfLoading && (
        <div className="pdf-loading-toast">
          <div className="pdf-loading-spinner" />
          <span>PDF 생성 중... ({pdfProgress.current}/{pdfProgress.total})</span>
        </div>
      )}
    </main>
  );
}

export default Book;
