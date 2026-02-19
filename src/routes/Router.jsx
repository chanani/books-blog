import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../page/home/Home';

const Book = lazy(() => import('../page/book/Book'));
const Chapter = lazy(() => import('../page/chapter/Chapter'));
const Reading = lazy(() => import('../page/reading/Reading'));
const About = lazy(() => import('../page/about/About'));
const NotFound = lazy(() => import('../page/notfound/NotFound'));

function Router() {
  return (
    <Suspense
      fallback={
        <div className="page-loading">
          <div className="loader-lg" />
          <p className="loading-text">페이지를 불러오는 중...</p>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/about" element={<About />} />
        <Route path="/book/:bookSlug" element={<Book />} />
        <Route path="/book/:bookSlug/read/*" element={<Chapter />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default Router;
