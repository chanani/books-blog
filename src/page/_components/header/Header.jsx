import { Link, useLocation } from 'react-router-dom';
import { FiSun, FiMoon, FiCode } from 'react-icons/fi';
import './Header.css';

function Header({ theme, toggleTheme }) {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/';
  const isDev = pathname === '/posts' || pathname.startsWith('/post');
  const isBooks = pathname === '/books' || pathname.startsWith('/book');
  const isAbout = pathname === '/about';

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <FiCode size={18} className="logo-icon" />
            <span className="logo-text">차나니의 블로그</span>
          </Link>

          <nav className="header-nav">
            <Link to="/posts" className={`header-tab${isDev ? ' active' : ''}`}>
              개발
            </Link>
            <Link to="/books" className={`header-tab${isBooks ? ' active' : ''}`}>
              책방
            </Link>
            <Link to="/about" className={`header-tab${isAbout ? ' active' : ''}`}>
              소개
            </Link>
          </nav>
        </div>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
        </button>
      </div>
    </header>
  );
}

export default Header;
