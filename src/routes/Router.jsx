import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../page/home/Home';

const Book = lazy(() => import('../page/book/Book'));
const Chapter = lazy(() => import('../page/chapter/Chapter'));
const About = lazy(() => import('../page/about/About'));

function Router() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="loader" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/book/:bookSlug" element={<Book />} />
        <Route path="/book/:bookSlug/read/*" element={<Chapter />} />
      </Routes>
    </Suspense>
  );
}

export default Router;
