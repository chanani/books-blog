import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiGithub, FiLinkedin } from 'react-icons/fi';
import { SiTistory } from 'react-icons/si';
import { useAuth } from '../../../context/AuthContext';
import './Footer.css';

const LINKS = [
  {
    href: 'https://github.com/chanani',
    icon: <FiGithub size={18} />,
    label: 'GitHub',
  },
  {
    href: 'https://chanhan.tistory.com/',
    icon: <SiTistory size={16} />,
    label: 'Blog',
  },
  {
    href: 'https://www.linkedin.com/in/%25EC%25B0%25AC%25ED%2595%259C-%25EC%259D%25B4-1648a6294/?skipRedirect=true',
    icon: <FiLinkedin size={18} />,
    label: 'LinkedIn',
  },
];

function Footer() {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  const handleSecretClick = useCallback(() => {
    clickCount.current += 1;

    if (clickTimer.current) clearTimeout(clickTimer.current);

    if (clickCount.current >= 3) {
      clickCount.current = 0;
      navigate('/admin');
      return;
    }

    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 2000);
  }, [navigate]);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-links">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
        </div>
        <p
          className={`footer-copy${authenticated ? ' footer-copy--admin' : ''}`}
          onClick={handleSecretClick}
        >
          &copy; chanani
        </p>
      </div>
    </footer>
  );
}

export default Footer;
