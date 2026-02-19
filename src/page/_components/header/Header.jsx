import { Link, useLocation } from 'react-router-dom';
import { FiSun, FiMoon, FiBookOpen } from 'react-icons/fi';
import './Header.css';

function Header({ theme, toggleTheme }) {
  const { pathname } = useLocation();
  const isAbout = pathname === '/about';
  const isReading = pathname === '/reading';
  const isBooks = !isAbout && !isReading;

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <Link to="/" className="header-logo">
            <FiBookOpen size={18} className="logo-icon" />
            <span className="logo-text">차나니의 책방</span>
          </Link>

          <nav className="header-nav">
            <Link to="/" className={`header-tab${isBooks ? ' active' : ''}`}>
              책방
            </Link>
            <Link to="/reading" className={`header-tab${isReading ? ' active' : ''}`}>
              독서현황
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
