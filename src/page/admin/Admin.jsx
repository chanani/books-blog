import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiLock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './Admin.css';

function VisitorCard({ visitors }) {
  return (
    <div className="admin-card">
      <div className="admin-card-title">방문자 통계</div>
      <div className="visitor-summary">
        <div className="visitor-item">
          <span className="visitor-label">Today</span>
          <span className="visitor-value">{visitors.today.toLocaleString()}</span>
        </div>
        <div className="visitor-item">
          <span className="visitor-label">Yesterday</span>
          <span className="visitor-value">{visitors.yesterday.toLocaleString()}</span>
        </div>
        <div className="visitor-item">
          <span className="visitor-label">Total</span>
          <span className="visitor-value">{visitors.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function aggregateDaily(hits) {
  const map = {};
  (hits || []).forEach((h) => {
    (h.stats || []).forEach((s) => {
      map[s.day] = (map[s.day] || 0) + (s.daily || 0);
    });
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
}

function aggregateWeekly(dailyEntries) {
  const weeks = {};
  dailyEntries.forEach(([day, count]) => {
    const d = new Date(day);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    weeks[key] = (weeks[key] || 0) + count;
  });
  return Object.entries(weeks).sort((a, b) => a[0].localeCompare(b[0]));
}

function aggregateMonthly(dailyEntries) {
  const months = {};
  dailyEntries.forEach(([day, count]) => {
    const key = day.slice(0, 7);
    months[key] = (months[key] || 0) + count;
  });
  return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
}

function PeriodChart({ hits }) {
  const [period, setPeriod] = useState('daily');
  const dailyAll = useMemo(() => aggregateDaily(hits), [hits]);

  const data = useMemo(() => {
    if (period === 'weekly') return aggregateWeekly(dailyAll).slice(-8);
    if (period === 'monthly') return aggregateMonthly(dailyAll);
    return dailyAll.slice(-7);
  }, [period, dailyAll]);

  const maxVal = Math.max(...data.map(([, v]) => v), 1);

  const formatLabel = (key) => {
    if (period === 'monthly') return key;
    return key.slice(5);
  };

  const periodLabels = { daily: '일별', weekly: '주별', monthly: '월별' };

  return (
    <div className="admin-card full-width">
      <div className="admin-card-header">
        <div className="admin-card-title">방문자 추이</div>
        <div className="period-tabs">
          {Object.entries(periodLabels).map(([key, label]) => (
            <button
              key={key}
              className={`period-tab${period === key ? ' active' : ''}`}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-bars">
        {data.map(([day, count]) => (
          <div className="chart-row" key={day}>
            <span className="chart-label">{formatLabel(day)}</span>
            <div className="chart-bar-wrap">
              <div className="chart-bar" style={{ width: `${(count / maxVal) * 100}%` }} />
            </div>
            <span className="chart-value">{count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HitsTable({ hits }) {
  const [expanded, setExpanded] = useState(false);
  const pages = (hits || [])
    .map((h) => ({ path: decodeURIComponent(h.path || ''), count: h.count || 0 }))
    .sort((a, b) => b.count - a.count);

  const top = pages.slice(0, 5);
  const rest = pages.slice(5);
  const hasMore = rest.length > 0;

  return (
    <div className="admin-card full-width">
      <div className="admin-card-header">
        <div className="admin-card-title">인기 페이지</div>
        {hasMore && (
          <button className="expand-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? '접기' : `더 보기 (${rest.length})`}
            {expanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
          </button>
        )}
      </div>
      <table className="stats-table">
        <thead>
          <tr>
            <th>페이지</th>
            <th>조회수</th>
          </tr>
        </thead>
        <tbody>
          {top.map((p) => (
            <tr key={p.path}>
              <td><span className="stats-path" title={p.path}>{p.path}</span></td>
              <td>{p.count.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`accordion-body${expanded ? ' open' : ''}`}>
        <div className="accordion-inner">
          <table className="stats-table">
            <tbody>
              {rest.map((p) => (
                <tr key={p.path}>
                  <td><span className="stats-path" title={p.path}>{p.path}</span></td>
                  <td>{p.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatBarCard({ title, data }) {
  const items = (data || []).slice(0, 8);
  const maxVal = Math.max(...items.map((d) => d.count || 0), 1);

  if (items.length === 0) {
    return (
      <div className="admin-card">
        <div className="admin-card-title">{title}</div>
        <p className="stat-empty">데이터 없음</p>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-card-title">{title}</div>
      <div className="stat-rows">
        {items.map((item, i) => (
          <div className="stat-row" key={item.name || item.id || item.language || i}>
            <span className="stat-name">{item.name || item.id || item.language || 'Unknown'}</span>
            <div className="stat-bar-bg">
              <div className="stat-bar-fill" style={{ width: `${((item.count || 0) / maxVal) * 100}%` }} />
            </div>
            <span className="stat-count">{(item.count || 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateLimitCard({ rateLimit }) {
  if (!rateLimit) return null;

  const { remaining, limit, reset } = rateLimit;
  const pct = (remaining / limit) * 100;
  const resetTime = new Date(reset * 1000).toLocaleTimeString();
  const barClass = pct < 10 ? 'danger' : pct < 30 ? 'warning' : '';

  return (
    <div className="admin-card">
      <div className="admin-card-title">GitHub API Rate Limit</div>
      <div className="rate-limit-info">
        <div className="rate-limit-bar-wrap">
          <div className={`rate-limit-bar ${barClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="rate-limit-text">
          <span>남은 요청</span>
          <span className="rate-limit-remaining">{remaining.toLocaleString()} / {limit.toLocaleString()}</span>
        </div>
        <span className="rate-limit-reset">리셋 시간: {resetTime}</span>
      </div>
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setSubmitting(true);
    setError('');

    const success = await onLogin(password);
    if (!success) {
      setError('비밀번호가 틀렸습니다.');
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-login-prompt">
      <FiLock size={32} className="admin-lock-icon" />
      <p>관리자 인증이 필요합니다.</p>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <input
          type="password"
          className="admin-password-input"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          disabled={submitting}
        />
        <button type="submit" className="admin-login-btn" disabled={submitting}>
          {submitting ? '확인 중...' : '확인'}
        </button>
      </form>
      {error && <span className="admin-login-error">{error}</span>}
    </div>
  );
}

function Admin() {
  const { authenticated, loading: authLoading, login, logout, getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated) return;

    const token = getToken();
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [authenticated, getToken]);

  if (authLoading || (authenticated && loading)) {
    return (
      <div className="page-loading">
        <img src="/profile.jpg" alt="이찬한" className="loading-avatar" />
        <p className="loading-text">페이지를 불러오는 중...</p>
        <span className="loading-dots"><span className="dot" /><span className="dot" /><span className="dot" /></span>
      </div>
    );
  }

  if (!authenticated) {
    return <main className="admin"><LoginForm onLogin={login} /></main>;
  }

  if (!stats) {
    return (
      <main className="admin">
        <div className="admin-login-prompt">
          <p>통계 데이터를 불러올 수 없습니다.</p>
          <button className="admin-logout-btn" onClick={logout}>로그아웃</button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin">
      <div className="admin-page">
        <div className="admin-header">
          <h1 className="admin-title">관리자 대시보드</h1>
          <button className="admin-logout-btn" onClick={logout}>로그아웃</button>
        </div>
        <div className="admin-grid">
          <VisitorCard visitors={stats.visitors || { today: 0, yesterday: 0, total: 0 }} />
          <RateLimitCard rateLimit={stats.rateLimit} />
          <PeriodChart hits={stats.hits} />
          <HitsTable hits={stats.hits} />
          <StatBarCard title="유입 경로" data={stats.referrers} />
          <StatBarCard title="브라우저" data={stats.browsers} />
          <StatBarCard title="운영체제" data={stats.systems} />
          <StatBarCard title="지역" data={stats.locations} />
        </div>
      </div>
    </main>
  );
}

export default Admin;
