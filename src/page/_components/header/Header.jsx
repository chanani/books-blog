import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSun, FiMoon, FiCode, FiMenu, FiX, FiGithub, FiLinkedin, FiMail } from 'react-icons/fi';
import { useDashboardStats } from '../../../context/DashboardContext';
import './Header.css';

function Header({ theme, toggleTheme }) {
  const { pathname } = useLocation();
  const isDev = pathname === '/posts' || pathname.startsWith('/post');
  const isBooks = pathname === '/books' || pathname.startsWith('/book');
  const isGuestbook = pathname === '/guestbook';

  const { stats } = useDashboardStats();
  const visitors = stats?.visitors || { today: 0, yesterday: 0, total: 0 };

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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
            <Link to="/guestbook" className={`header-tab${isGuestbook ? ' active' : ''}`}>
              방명록
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

        <button
          className="drawer-toggle"
          onClick={() => setDrawerOpen(true)}
          aria-label="메뉴 열기"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {drawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      <div className={`mobile-drawer${drawerOpen ? ' open' : ''}`}>
        <button
          className="drawer-close"
          onClick={() => setDrawerOpen(false)}
          aria-label="메뉴 닫기"
        >
          <FiX size={20} />
        </button>

        <div className="drawer-profile">
          <img src="/profile.jpg" alt="이찬한" className="drawer-avatar" />
          <span className="drawer-name">차나니</span>
          <span className="drawer-desc">안녕하세요,<br />서버 개발자 이찬한입니다👋</span>
        </div>

        <div className="drawer-socials">
          <a href="https://github.com/chanani" target="_blank" rel="noopener noreferrer" className="drawer-social-btn" aria-label="GitHub">
            <FiGithub size={15} />
          </a>
          <a href="https://www.linkedin.com/in/%EC%B0%AC%ED%95%9C-%EC%9D%B4-1648a6294/?skipRedirect=true" target="_blank" rel="noopener noreferrer" className="drawer-social-btn" aria-label="LinkedIn">
            <FiLinkedin size={15} />
          </a>
          <a href="mailto:theholidaynight@gmail.com" className="drawer-social-btn" aria-label="Mail">
            <FiMail size={15} />
          </a>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">방문자</div>
          <div className="drawer-visitor-rows">
            <div className="drawer-visitor-row">
              <span className="drawer-visitor-label">Today</span>
              <span className="drawer-visitor-num">{visitors.today.toLocaleString()}</span>
            </div>
            <div className="drawer-visitor-row">
              <span className="drawer-visitor-label">Yesterday</span>
              <span className="drawer-visitor-num">{visitors.yesterday.toLocaleString()}</span>
            </div>
            <div className="drawer-visitor-row">
              <span className="drawer-visitor-label">Total</span>
              <span className="drawer-visitor-num">{visitors.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">테마</div>
          <button className="drawer-theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
            {theme === 'light' ? '다크모드' : '라이트모드'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
