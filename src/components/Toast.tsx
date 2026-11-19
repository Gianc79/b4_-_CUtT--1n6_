import React, { useState, useRef, useEffect } from 'react';

interface SwipeDismissState {
  offsetX: number;
  isDragging: boolean;
  isDismissing: boolean;
  handlers: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
  style: React.CSSProperties;
}

export function useSwipeRightDismiss(
  activeKey: unknown,
  onDismiss?: () => void
): SwipeDismissState {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const startXRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dismissTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setOffsetX(0);
    setIsDragging(false);
    setIsDismissing(false);
    startXRef.current = null;
    pointerIdRef.current = null;
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, [activeKey]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onDismiss || isDismissing) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button')) return;
    startXRef.current = e.clientX;
    pointerIdRef.current = e.pointerId;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || startXRef.current === null) return;
    const dx = Math.max(0, e.clientX - startXRef.current);
    setOffsetX(dx);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (pointerIdRef.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      } catch (_) {}
    }
    pointerIdRef.current = null;
    const dx = startXRef.current !== null ? Math.max(0, e.clientX - startXRef.current) : offsetX;
    startXRef.current = null;

    if (dx > 60 && onDismiss) {
      setIsDismissing(true);
      setOffsetX(Math.max(window.innerWidth || 400, 360));
      dismissTimerRef.current = window.setTimeout(() => {
        onDismiss();
      }, 180);
    } else {
      setOffsetX(0);
    }
  };

  const style: React.CSSProperties =
    isDragging || isDismissing || offsetX > 0
      ? {
          transform: `translate(calc(-50% + ${offsetX}px), 0)`,
          opacity: isDismissing ? 0 : Math.max(0.18, 1 - offsetX / 220),
          transition: isDragging ? 'none' : 'transform 0.18s ease-out, opacity 0.18s ease-out',
          animation: 'none',
        }
      : {};

  return {
    offsetX,
    isDragging,
    isDismissing,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
    },
    style,
  };
}

interface ToastProps {
  message: string | null;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  const swipe = useSwipeRightDismiss(message, onDismiss);

  return (
    <div
      className={`toast ${message ? 'show' : ''} ${swipe.isDragging ? 'is-swiping' : ''}`.trim()}
      role="status"
      aria-live="polite"
      style={message ? swipe.style : undefined}
      {...(message ? swipe.handlers : {})}
    >
      {message || ''}
    </div>
  );
};

