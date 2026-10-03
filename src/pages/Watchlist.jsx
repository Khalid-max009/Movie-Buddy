import { useState } from "react";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import "../css/Watchlist.css";
import WatchlistProgress from "../components/WatchlistProgress";

function Watchlist() {
  const { watchlist } = useMovieContext();
  const [filter, setFilter] = useState("all"); // "all" | "watched" | "unwatched"

  const filteredMovies = watchlist.filter((movie) => {
    if (filter === "watched") return movie.watched;
    if (filter === "unwatched") return !movie.watched;
    return true;
  });

  const unwatchedCount = watchlist.filter((m) => !m.watched).length;
  const watchedCount = watchlist.filter((m) => m.watched).length;

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="watchlist-empty">
        <h2>Your Watchlist is Empty</h2>
        <p>Add movies to your watchlist to keep track of what you want to watch!</p>
      </div>
    );
  }

  return (
    <div className="watchlist-container">
      <h2 className="page-title">My Watchlist</h2>
      <WatchlistProgress movies={watchlist} />

      {/* Filter Controls */}
      <div className="filter-container">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
          type="button"
        >
          All ({watchlist.length})
        </button>
        <button
          className={filter === "unwatched" ? "active" : ""}
          onClick={() => setFilter("unwatched")}
          type="button"
        >
          Not Watched ({unwatchedCount})
        </button>
        <button
          className={filter === "watched" ? "active" : ""}
          onClick={() => setFilter("watched")}
          type="button"
        >
          Watched ({watchedCount})
        </button>
      </div>

      {filteredMovies.length === 0 ? (
        <p className="no-filter-results">
          No movies found under the "{filter === "watched" ? "Watched" : "Not Watched"}" tab.
        </p>
      ) : (
        <div className="movies-grid">
          {filteredMovies.map((movie) => (
            <MovieCard movie={movie} key={movie.id} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;