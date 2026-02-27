import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Router from './routes/Router';
import Header from './page/_components/header/Header';
import Footer from './page/_components/footer/Footer';
import { DashboardProvider } from './context/DashboardContext';
import { AuthProvider } from './context/AuthContext';
import usePageView from './hooks/usePageView';

function AppInner({ theme, toggleTheme }) {
  usePageView();

  return (
    <div className="app">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Router />
      <Footer />
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <DashboardProvider>
          <AppInner theme={theme} toggleTheme={toggleTheme} />
        </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
