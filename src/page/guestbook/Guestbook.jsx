import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import './Guestbook.css';

const GISCUS_HOST = 'https://giscus.app';

function buildGiscusSrc(theme) {
  const params = new URLSearchParams({
    origin: location.href,
    session: '',
    repo: 'chanani/books-blog',
    repoId: 'R_kgDORI3Ksw',
    category: 'Announcements',
    categoryId: 'DIC_kwDORI3Ks84C15da',
    term: 'guestbook',
    strict: '0',
    reactionsEnabled: '0',
    emitMetadata: '0',
    inputPosition: 'bottom',
    theme,
    lang: 'ko',
    sort: 'newest',
  });
  return `${GISCUS_HOST}/ko/widget?${params.toString()}`;
}

function Guestbook() {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(150);
  const [giscusTheme, setGiscusTheme] = useState(
    () => `https://chanani-books.vercel.app/giscus-${document.documentElement.getAttribute('data-theme') || 'light'}.css?v=4`,
  );

  const handleMessage = useCallback((e) => {
    if (e.origin !== GISCUS_HOST) return;
    const { data } = e;
    if (typeof data !== 'object' || !data.giscus) return;
    if (data.giscus.resizeHeight) {
      setIframeHeight(data.giscus.resizeHeight);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = `https://chanani-books.vercel.app/giscus-${t}.css?v=4`;
      setGiscusTheme(newTheme);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { giscus: { setConfig: { theme: newTheme } } },
          GISCUS_HOST,
        );
      }
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
          <p className="guestbook-desc">
            자유롭게 글을 남겨주세요 👋
          </p>
        </div>

        <section className="guestbook-comments">
          <iframe
            ref={iframeRef}
            title="Comments"
            src={buildGiscusSrc(giscusTheme)}
            scrolling="no"
            loading="lazy"
            allow="clipboard-write"
            className="giscus-frame"
            style={{ height: `${iframeHeight}px` }}
          />
        </section>
      </motion.div>
    </main>
  );
}

export default Guestbook;
