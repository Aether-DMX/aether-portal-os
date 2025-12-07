import { useEffect } from 'react';
import useUIStore from '../store/uiStore';

export default function useActivity() {
  const { updateActivity, screenSaverTimeout, setScreenSaverActive, lastActivity } = useUIStore();

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  useEffect(() => {
    const checkScreenSaver = setInterval(() => {
      const now = Date.now();
      const idle = now - lastActivity;
      
      if (idle >= screenSaverTimeout) {
        setScreenSaverActive(true);
      }
    }, 1000);

    return () => clearInterval(checkScreenSaver);
  }, [lastActivity, screenSaverTimeout, setScreenSaverActive]);
}
