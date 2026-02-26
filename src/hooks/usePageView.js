import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function usePageView() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (window.goatcounter?.count) {
      window.goatcounter.count({
        path: location.pathname,
        title: document.title,
      });
    }
  }, [location.pathname]);
}
