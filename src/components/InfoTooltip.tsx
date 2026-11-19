import React, { useState, useRef, useEffect, useCallback } from 'react';

interface InfoTooltipProps {
  content: React.ReactNode;
  label?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  label = 'Informazioni',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const margin = 12;
    const maxWidth = Math.min(340, vw - margin * 2);
    const btnCenterX = rect.left + rect.width / 2;

    let left = btnCenterX - 28;
    if (left + maxWidth > vw - margin) {
      left = vw - margin - maxWidth;
    }
    if (left < margin) {
      left = margin;
    }

    const arrowLeft = Math.max(16, Math.min(maxWidth - 20, btnCenterX - left));

    setCoords({
      top: rect.bottom + 10,
      left,
      arrowLeft,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize);
    };
  }, [open, updatePosition]);

  return (
    <span className="info-tooltip-anchor">
      <button
        ref={btnRef}
        type="button"
        className={`info-tooltip-btn ${open ? 'active' : ''}`}
        onClick={e => {
          e.stopPropagation();
          setOpen(prev => !prev);
        }}
        aria-label={label}
        aria-expanded={open}
        title={label}
      >
        <span className="info-tooltip-glyph" aria-hidden="true">i</span>
      </button>

      {open && coords && (
        <div
          ref={popoverRef}
          className="info-tooltip-popover"
          role="tooltip"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
        >
          <span
            className="info-tooltip-arrow"
            style={{ left: `${coords.arrowLeft}px` }}
            aria-hidden="true"
          />
          <div className="info-tooltip-content">{content}</div>
        </div>
      )}
    </span>
  );
};
