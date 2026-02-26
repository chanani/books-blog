import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import DevHome from '../page/dev/DevHome';

const DevPost = lazy(() => import('../page/dev/DevPost'));
const Home = lazy(() => import('../page/home/Home'));
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
        <Route path="/" element={<DevHome />} />
        <Route path="/post/:category/:slug" element={<DevPost />} />
        <Route path="/books" element={<Home />} />
        <Route path="/books/reading" element={<Reading />} />
        <Route path="/about" element={<About />} />
        <Route path="/book/:bookSlug" element={<Book />} />
        <Route path="/book/:bookSlug/read/*" element={<Chapter />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default Router;
