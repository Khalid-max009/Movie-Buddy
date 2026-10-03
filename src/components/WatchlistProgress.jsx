import "../css/WatchlistProgress.css";

function WatchlistProgress({ movies }) {
  const total = movies.length;
  const watchedCount = movies.filter((movie) => movie.watched).length;
  const percentage = total > 0 ? Math.round((watchedCount / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div className="watchlist-progress-container">
      <div className="progress-info">
        <span className="progress-text">
          <strong>{watchedCount}</strong> of <strong>{total}</strong> movies watched
        </span>
        <span className="progress-percentage">{percentage}%</span>
      </div>

      <div className="progress-bar-background">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default WatchlistProgress;