import { useMovieContext } from "../contexts/MovieContext";
import "../css/movieCard.css";
import { getMovieTrailer } from "../services/api";
import { Link } from "react-router-dom";

function MovieCard({ movie }) {
  const { 
    favorites,
    isFavorite, 
    addToFavorites, 
    removeFromFavorites,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    inWatchlist 
  } = useMovieContext();

  const favorite = isFavorite(movie.id);
  const isBookmarked = inWatchlist(movie.id);
  
  const watchlistMovie = watchlist.find((m) => m.id === movie.id);
  const isWatched = watchlistMovie ? watchlistMovie.watched : false;

  function onFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    favorite ? removeFromFavorites(movie.id) : addToFavorites(movie);
  }

  function onWatchlistClick(e) {
    e.preventDefault();
    e.stopPropagation();
    isBookmarked ? removeFromWatchlist(movie.id) : addToWatchlist(movie);
  }

  function onToggleWatchedClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleWatched(movie.id);
  }

  async function handlePlay(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const videoKey = await getMovieTrailer(movie.id);
      if (videoKey) {
        window.open(`https://www.youtube.com/watch?v=${videoKey}`, "_blank");
      } else {
        window.open(
          `https://www.youtube.com/results?search_query=${encodeURIComponent(
            movie.title + " trailer"
          )}`,
          "_blank"
        );
      }
    } catch (err) {
      console.error("Error launching trailer:", err);
    }
  }

  return (
    <div className={`MovieCard ${isWatched ? "watched" : ""}`}>
      <div className="poster-container">
        <Link to={`/movie/${movie.id}`} className="poster-link">
          <img
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "https://via.placeholder.com/500x750?text=No+Poster"
            }
            alt={movie.title}
          />
          
          <div className="details-overlay">
            <span>ℹ️ Details</span>
          </div>
        </Link>

        {/* Floating Top Badges */}
        <button
          className={`favorite-btn ${favorite ? "active" : ""}`}
          onClick={onFavoriteClick}
          type="button"
          title={favorite ? "Remove from Favorites" : "Add to Favorites"}
        >
          ♥
        </button>

        <button
          className={`watchlist-btn ${isBookmarked ? "active" : ""}`}
          onClick={onWatchlistClick}
          type="button"
        >
          {isBookmarked ? "🔖 Saved" : "+ Watchlist"}
        </button>
      </div>

      {/* Info Section */}
      <div className="who">
        <Link to={`/movie/${movie.id}`} className="title-link">
          <h2>{movie.title}</h2>
        </Link>
        <span className="release-year">
          {movie.release_date ? movie.release_date.split("-")[0] : "N/A"}
        </span>
      </div>

      {/* Card Action Buttons */}
      <div className="card-footer">
        {isBookmarked && (
          <button
            className={`status-btn ${isWatched ? "status-watched" : "status-unwatched"}`}
            onClick={onToggleWatchedClick}
            type="button"
          >
            {isWatched ? "✓ Watched" : "Mark as Watched"}
          </button>
        )}

        <button className="play-btn" onClick={handlePlay} type="button">
          ▶ Play
        </button>
      </div>
    </div>
  );
}

export default MovieCard;