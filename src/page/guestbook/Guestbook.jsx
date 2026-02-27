import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Giscus from '@giscus/react';
import './Guestbook.css';

function Guestbook() {
  const [giscusTheme, setGiscusTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light',
  );

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
          <p className="guestbook-desc">
            자유롭게 글을 남겨주세요 👋
          </p>
        </div>

        <section className="guestbook-comments">
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
            theme={`https://chanani-books.vercel.app/giscus-${giscusTheme}.css`}
            lang="ko"
          />
        </section>
      </motion.div>
    </main>
  );
}

export default Guestbook;
