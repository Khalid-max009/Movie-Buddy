 import "../css/MovieCardSkeleton.css";

function MovieCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-poster shimmer" />
      <div className="skeleton-info">
        <div className="skeleton-title shimmer" />
        <div className="skeleton-date shimmer" />
      </div>
    </div>
  );
}

export default MovieCardSkeleton;