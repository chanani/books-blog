import { Link } from 'react-router-dom';
import { FiSun, FiMoon, FiBookOpen } from 'react-icons/fi';
import './Header.css';

function Header({ theme, toggleTheme }) {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <FiBookOpen size={20} className="logo-icon" />
          <span className="logo-text">차나니의 기록</span>
        </Link>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        </button>
      </div>
    </header>
  );
}

export default Header;
