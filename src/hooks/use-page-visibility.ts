import { useEffect, useState } from 'react';
export function usePageVisibility(): boolean {

  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {

    const change = () => {
      setVisible(!document.hidden);
      document.documentElement.dataset.paused = document.hidden ? 'true' : 'false';
    };

    document.addEventListener('visibilitychange', change);

    return () => document.removeEventListener('visibilitychange', change);

  }, []);

  return visible;
}
