import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom"; // Added useLocation
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import "../css/MovieDetails.css";
import MoviePlayer from '../components/MoviePlayer';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

function MovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  
  // Determine if it's a TV series based on URL pathname or passed state
  const isTvSeries = location.pathname.includes('/tv/') || location.state?.mediaType === 'tv';

  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [cast, setCast] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    inWatchlist,
    addToWatchlist,
    removeFromWatchlist,
  } = useMovieContext();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const mediaEndpoint = isTvSeries ? 'tv' : 'movie';

        // 1. Fetch basic details (Movie or TV)
        const res = await fetch(`${BASE_URL}/${mediaEndpoint}/${id}?api_key=${API_KEY}`);
        const data = await res.json();
        setMovie(data);

        // 2. Fetch videos for trailer
        const videoRes = await fetch(`${BASE_URL}/${mediaEndpoint}/${id}/videos?api_key=${API_KEY}`);
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
        const castRes = await fetch(`${BASE_URL}/${mediaEndpoint}/${id}/credits?api_key=${API_KEY}`);
        const castData = await castRes.json();
        setCast(castData.cast ? castData.cast.slice(0, 10) : []);

        // 4. Fetch Similar Recommendations
        const recRes = await fetch(`${BASE_URL}/${mediaEndpoint}/${id}/recommendations?api_key=${API_KEY}`);
        const recData = await recRes.json();
        setRecommendations(recData.results ? recData.results.slice(0, 8) : []);

      } catch (err) {
        console.error("Error fetching details:", err);
        setTrailerKey(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    window.scrollTo(0, 0);
  }, [id, isTvSeries]);

  if (loading) return <div className="loading">Loading details...</div>;
  if (!movie) return <div className="error">Title not found.</div>;

  const favorite = isFavorite(movie.id);
  const bookmarked = inWatchlist(movie.id);

  // Fallbacks for Movie vs TV properties
  const title = movie.title || movie.name;
  const releaseDate = movie.release_date || movie.first_air_date;

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
              alt={title} 
              className="details-poster"
            />
            <div className="details-info">
              <h1>{title} ({releaseDate?.split("-")[0] || "N/A"})</h1>
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
                {movie.runtime || (movie.episode_run_time && movie.episode_run_time[0])
                  ? `${movie.runtime || movie.episode_run_time[0]} mins` 
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

      {/* Streaming Section */}
      <div className="trailer-section streaming-player-section">
        <h2>🎥 Watch Full Streaming (HD Stream)</h2>
        <MoviePlayer 
          movieId={movie.id} 
          mediaType={isTvSeries ? 'tv' : 'movie'} 
          title={title} 
        />
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