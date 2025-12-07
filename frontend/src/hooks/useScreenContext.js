import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const getApiUrl = () => `http://${window.location.hostname}:8891`;

export function useScreenContext() {
  const location = useLocation();

  useEffect(() => {
    const page = location.pathname.split('/')[1] || 'Dashboard';
    
    fetch(`${getApiUrl()}/api/screen-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, action: null })
    }).catch(e => console.error('Screen context update failed:', e));
  }, [location]);
}

export default useScreenContext;
