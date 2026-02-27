import { createContext, useContext, useState, useEffect } from 'react';
import { fetchDashboardStats } from '../api/dashboard';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardContext.Provider value={{ stats, loading }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardStats() {
  return useContext(DashboardContext);
}
