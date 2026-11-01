import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function InactivityLogout() {
  const { logout } = useAuth();

  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [logout]);

  return null;
}
