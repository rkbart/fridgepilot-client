import { useEffect, useRef } from 'react';

interface ChevronActionsProps {
  isOpen: boolean;
  onToggle: () => void;
  actions: React.ReactNode;
  children: React.ReactNode;
}

export default function ChevronActions({ isOpen, onToggle, actions, children }: ChevronActionsProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const onToggleRef = useRef(onToggle);

  useEffect(() => {
    onToggleRef.current = onToggle;
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        onToggleRef.current();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="chevron-row" ref={rowRef}>
      <div className="chevron-row-main">
        <div className="chevron-row-content">{children}</div>
        <button
          type="button"
          className={`chevron-btn ${isOpen ? 'open' : ''}`}
          aria-label={isOpen ? 'Hide actions' : 'Show actions'}
          aria-expanded={isOpen}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className={`reveal-panel ${isOpen ? 'open' : ''}`}>
        <div className="reveal-panel-inner">
          <div className="reveal-actions">{actions}</div>
        </div>
      </div>
    </div>
  );
}