import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (!saved) {
      setLoading(false);
      return;
    }

    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: saved }),
    })
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem('admin_token');
        }
      })
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      localStorage.setItem('admin_token', password);
      setAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setAuthenticated(false);
  }, []);

  const getToken = useCallback(() => localStorage.getItem('admin_token'), []);

  return (
    <AuthContext.Provider value={{ authenticated, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
