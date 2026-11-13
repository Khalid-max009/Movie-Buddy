import { useMovieContext } from "../contexts/MovieContext";
import "../css/movieCard.css";
import { Link, useNavigate } from "react-router-dom";

function MovieCard({ movie, mediaType = "movie" }) {
  const navigate = useNavigate();
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

  // Use title for movies, name for TV series
  const displayTitle = movie.title || movie.name;

  // 1. Properly evaluate the actual media type (prioritizing TMDB's movie.media_type)
  const actualMediaType = movie.media_type || mediaType || (movie.first_air_date ? "tv" : "movie");
  const routePrefix = actualMediaType === "tv" ? "tv" : "movie";

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

  function handlePlay(e) {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/${routePrefix}/${movie.id}`);
  }  

  return (
    <div className={`MovieCard ${isWatched ? "watched" : ""}`}>
      <div className="poster-container">
        {/* FIXED: Uses actualMediaType for correct routing */}
        <Link to={`/${routePrefix}/${movie.id}`} className="poster-link">
          <img
            src={
              movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "https://via.placeholder.com/500x750?text=No+Poster"
            }
            alt={displayTitle}
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
        {/* FIXED: Uses actualMediaType for correct routing */}
        <Link to={`/${routePrefix}/${movie.id}`} className="title-link">
          <h2>{displayTitle}</h2>
        </Link>
        <span className="release-year">
          {(movie.release_date || movie.first_air_date) 
            ? (movie.release_date || movie.first_air_date).split("-")[0] 
            : "N/A"}
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

        {/* FIXED: Dynamically displays Play Full Series or Play Full Movie */}
        <button className="play-btn" onClick={handlePlay} type="button">
          {actualMediaType === "tv" ? "📺 Play Full Series" : "▶ Play Full Movie"}
        </button>
      </div>
    </div>
  );
}

export default MovieCard; // (Keep your export default MovieCard format)