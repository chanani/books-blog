import { Helmet } from 'react-helmet-async';
import { FiGithub, FiLinkedin } from 'react-icons/fi';
import { SiTistory } from 'react-icons/si';
import './About.css';

const SOCIAL_LINKS = [
  {
    href: 'https://github.com/chanani',
    icon: <FiGithub size={18} />,
    label: 'GitHub',
  },
  {
    href: 'https://chanhan.tistory.com/',
    icon: <SiTistory size={16} />,
    label: 'Tistory',
  },
  {
    href: 'https://www.linkedin.com/in/%25EC%25B0%25AC%25ED%2595%259C-%25EC%259D%25B4-1648a6294/?skipRedirect=true',
    icon: <FiLinkedin size={18} />,
    label: 'LinkedIn',
  },
];

function About() {
  return (
    <main className="about">
      <Helmet>
        <title>소개 - 차나니의 책방</title>
        <meta name="description" content="서버 개발자 이찬한입니다. 차나니의 책방 운영자 소개 페이지입니다." />
        <meta property="og:title" content="소개 - 차나니의 책방" />
        <meta property="og:description" content="서버 개발자 이찬한입니다." />
        <link rel="canonical" href="https://chanani-books.vercel.app/about" />
      </Helmet>
      <div className="about-card">
        <div className="about-profile">
          <img src="/profile.png" alt="이찬한" className="about-avatar" />
          <h1 className="about-name">이찬한</h1>
        </div>
        <p className="about-bio">
          안녕하세요 👋 서버 개발자 이찬한입니다.
          <br />
          방문해주셔서 감사합니다.
        </p>

        <div className="about-social">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="about-social-link"
            >
              {link.icon}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

export default About;
