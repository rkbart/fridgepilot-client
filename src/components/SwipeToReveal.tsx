import { useRef, useState, useCallback, useEffect } from 'react';

interface SwipeToRevealProps {
  children: React.ReactNode;
  actions: React.ReactNode;
  disabled?: boolean;
}

export default function SwipeToReveal({ children, actions, disabled }: SwipeToRevealProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const close = useCallback(() => {
    setTransitioning(true);
    setOffsetX(0);
    setTimeout(() => setTransitioning(false), 250);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (offsetX !== 0 && contentRef.current && !contentRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [offsetX, close]);

  if (disabled) {
    return <div className="swipe-container">{children}</div>;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;

    if (offsetX === 0 && diff > 0) {
      const maxSwipe = 130;
      const dampedDiff = Math.min(diff * 0.6, maxSwipe);
      setOffsetX(dampedDiff);
    } else if (offsetX > 0 && diff < 0) {
      const dampedDiff = Math.max(offsetX + (diff * 0.6), 0);
      setOffsetX(dampedDiff);
    }
  };

  const handleTouchEnd = () => {
    setTransitioning(true);
    if (offsetX > 50) {
      setOffsetX(110);
    } else {
      setOffsetX(0);
    }
    setTimeout(() => setTransitioning(false), 250);
  };

  return (
    <div className="swipe-container">
      <div className="swipe-actions">{actions}</div>
      <div
        ref={contentRef}
        className={`swipe-content ${transitioning ? 'swipe-transitioning' : ''}`}
        style={{ transform: `translateX(-${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
