import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import "../css/movieDetails.css";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [cast, setCast] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Destructure Watchlist alongside Favorites from Context
  const {
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    inWatchlist,
    addToWatchlist,
    removeFromWatchlist,
  } = useMovieContext();

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);

        // 1. Fetch basic movie details
        const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
        const data = await res.json();
        setMovie(data);

        // 2. Fetch videos for YouTube trailer
        const videoRes = await fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`);
        const videoData = await videoRes.json();
        
        if (videoData.results && videoData.results.length > 0) {
          const foundVideo = videoData.results.find(
            (vid) => vid.site === "YouTube" && (vid.type === "Trailer" || vid.type === "Teaser" || vid.type === "Clip")
          ) || videoData.results.find((vid) => vid.site === "YouTube");

          setTrailerKey(foundVideo ? foundVideo.key : null);
        } else {
          setTrailerKey(null);
        }

        // 3. Fetch Cast Credits
        const castRes = await fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`);
        const castData = await castRes.json();
        setCast(castData.cast ? castData.cast.slice(0, 10) : []); // Top 10 actors

        // 4. Fetch Similar Recommendations
        const recRes = await fetch(`${BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}`);
        const recData = await recRes.json();
        setRecommendations(recData.results ? recData.results.slice(0, 8) : []);

      } catch (err) {
        console.error("Error fetching movie details:", err);
        setTrailerKey(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
    window.scrollTo(0, 0); // Scroll to top when loading a new movie
  }, [id]);

  if (loading) return <div className="loading">Loading movie details...</div>;
  if (!movie) return <div className="error">Movie not found.</div>;

  const favorite = isFavorite(movie.id);
  const bookmarked = inWatchlist(movie.id);

  return (
    <div className="movie-details-container">
      <div 
        className="backdrop-banner" 
        style={{
          backgroundImage: movie.backdrop_path 
            ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` 
            : 'none'
        }}
      >
        <div className="backdrop-overlay">
          <div className="details-header">
            <img 
              src={
                movie.poster_path 
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                  : "https://via.placeholder.com/500x750?text=No+Poster"
              } 
              alt={movie.title} 
              className="details-poster"
            />
            <div className="details-info">
              <h1>{movie.title} ({movie.release_date?.split("-")[0] || "N/A"})</h1>
              {movie.tagline && <p className="tagline"><em>"{movie.tagline}"</em></p>}
              
              <div className="genres">
                {movie.genres?.map((g) => (
                  <span key={g.id} className="genre-badge">{g.name}</span>
                ))}
              </div>

              <p className="overview">{movie.overview || "No overview available for this title."}</p>
              <p>⭐ <strong>Rating:</strong> {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"} / 10</p>
              
              <p>
                ⏱️ <strong>Runtime:</strong>{" "}
                {movie.runtime && movie.runtime > 0 
                  ? `${movie.runtime} mins` 
                  : "Not specified"}
              </p>

              {/* Action Buttons Container */}
              <div className="action-buttons-group">
                <button 
                  className={`fav-btn ${favorite ? "active" : ""}`}
                  onClick={() => favorite ? removeFromFavorites(movie.id) : addToFavorites(movie)}
                  type="button"
                >
                  {favorite ? "❤️ Remove Favorite" : "🤍 Add to Favorites"}
                </button>

                <button 
                  className={`watchlist-btn ${bookmarked ? "active" : ""}`}
                  onClick={() => bookmarked ? removeFromWatchlist(movie.id) : addToWatchlist(movie)}
                  type="button"
                >
                  {bookmarked ? "🔖 In Watchlist" : "📌 Add to Watchlist"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Section */}
      <div className="trailer-section">
        <h2>Official Trailer</h2>
        {trailerKey ? (
          <div className="video-responsive">
            <iframe
              width="853"
              height="480"
              src={`https://www.youtube.com/embed/${trailerKey}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embedded YouTube Trailer"
            />
          </div>
        ) : (
          <p className="no-trailer">No official trailer available for this title on TMDB.</p>
        )}
      </div>

      {/* Cast Section */}
      {cast.length > 0 && (
        <div className="cast-section">
          <h2>Top Cast</h2>
          <div className="cast-grid">
            {cast.map((actor) => (
              <div key={actor.id} className="actor-card">
                <img
                  src={
                    actor.profile_path
                      ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                      : "https://via.placeholder.com/185x278?text=No+Photo"
                  }
                  alt={actor.name}
                />
                <p className="actor-name">{actor.name}</p>
                <p className="character-name">{actor.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h2>More Like This</h2>
          <div className="movies-grid">
            {recommendations.map((recMovie, index) => (
              <MovieCard movie={recMovie} key={`${recMovie.id}-${index}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetails;