import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="notfound-page">
      <Helmet>
        <title>404 - 차나니의 책방</title>
        <meta name="description" content="페이지를 찾을 수 없습니다." />
      </Helmet>
      <div className="notfound-content">
        <span className="notfound-code">404</span>
        <h1 className="notfound-title">페이지를 찾을 수 없습니다</h1>
        <p className="notfound-desc">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="notfound-actions">
          <button className="notfound-btn secondary" onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} />
            <span>이전 페이지</span>
          </button>
          <button className="notfound-btn primary" onClick={() => navigate('/')}>
            <FiHome size={16} />
            <span>홈으로</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default NotFound;
