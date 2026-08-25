export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton-header">
        <div className="skeleton-image"></div>
        <div className="skeleton-info">
          <div className="skeleton-title"></div>
          <div className="skeleton-meta"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <div className="skeleton-checkbox"></div>
          <div className="skeleton-content"></div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-header-section">
        <div className="skeleton-title-large"></div>
        <div className="skeleton-subtitle"></div>
      </div>
      <div className="skeleton-toolbar">
        <div className="skeleton-search"></div>
      </div>
      <div className="skeleton-grid">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
