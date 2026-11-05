import React, { useState, useEffect, useRef } from 'react';

export const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > 180) {
        setVisible(true);

        // Auto-fade after 3.5 seconds of inactivity
        if (hideTimerRef.current) {
          window.clearTimeout(hideTimerRef.current);
        }
        hideTimerRef.current = window.setTimeout(() => {
          setVisible(false);
        }, 3500);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      className="scroll-to-top-btn"
      onClick={handleClick}
      aria-label="Torna all'inizio della pagina"
      title="Torna su"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
};
