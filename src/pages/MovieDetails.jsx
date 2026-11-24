import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import "../css/MovieDetails.css";
 
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

function MovieDetails() {
  const { id } = useParams();
  const location = useLocation();
  const isTvSeries = location.pathname.includes('/tv/') || location.state?.mediaType === 'tv';
  
  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [cast, setCast] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [watchProviders, setWatchProviders] = useState(null);
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

        // 1. Fetch basic details
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

        // 5. Fetch Watch Providers
        const provRes = await fetch(`${BASE_URL}/${mediaEndpoint}/${id}/watch/providers?api_key=${API_KEY}`);
        const provData = await provRes.json();
        setWatchProviders(provData?.results?.NG || provData?.results?.US || null);

      } catch (err) {
        console.error("Error fetching details:", err);
        setTrailerKey(null);
        setWatchProviders(null);
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
  
  const releaseDate = movie.release_date || movie.first_air_date;
  const rawTitle = movie.title || movie.name || "";
  const title = rawTitle;

  const encodedTitle = encodeURIComponent(rawTitle);
  const releaseYear = releaseDate?.split("-")[0] || "";

  // Dynamic YouTube Search URL for full movie/series streams & content
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${rawTitle} ${releaseYear} full movie`)}`;

  // Official & Subscription Streaming Platforms
  const officialPlatforms = [
    {
      name: "Search Full Movie on YouTube",
      icon: "▶️",
      color: "#ff0000",
      url: youtubeSearchUrl
    },
    {
      name: "Prime Video",
      icon: "📺",
      color: "#00A8E1",
      url: `https://www.amazon.com/s?k=${encodedTitle}&i=instant-video`
    },
    {
      name: "Google Play / Apple TV",
      icon: "🎬",
      color: "#ea4335",
      url: `https://play.google.com/store/search?q=${encodedTitle}&c=movies`
    }
  ];

  const streamProviders = watchProviders?.flatrate || [];
  const rentProviders = watchProviders?.rent || [];
  const buyProviders = watchProviders?.buy || [];
  const hasWatchProviders = streamProviders.length > 0 || rentProviders.length > 0 || buyProviders.length > 0;
  
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

              {/* Series Season/Episode Metadata */}
              {isTvSeries && (
                <div className="series-meta-row" style={{ display: "flex", gap: "10px", margin: "4px 0" }}>
                  <span className="series-badge" style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #3b82f6", color: "#60a5fa", padding: "4px 10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700" }}>
                    📺 {movie.number_of_seasons || 1} {movie.number_of_seasons === 1 ? "Season" : "Seasons"}
                  </span>
                  <span className="series-badge" style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #3b82f6", color: "#60a5fa", padding: "4px 10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700" }}>
                    🎬 {movie.number_of_episodes || "N/A"} Episodes
                  </span>
                </div>
              )}

              <p className="overview">{movie.overview || "No overview available for this title."}</p>
              <p><strong>Rating:</strong> {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"} / 10</p>
              <p>
                <strong>Runtime:</strong>{" "}
                {movie.runtime || (movie.episode_run_time && movie.episode_run_time[0])
                  ? `${movie.runtime || movie.episode_run_time[0]} mins`
                  : "Not specified"}
              </p>

              <div className="action-buttons-group">
                <button
                  className={`fav-btn ${favorite ? "active" : ""}`}
                  onClick={() => favorite ? removeFromFavorites(movie.id) : addToFavorites(movie)}
                  type="button"
                >
                  {favorite ? "♥ Remove Favorite" : "♡ Add to Favorites"}
                </button>
                <button
                  className={`watchlist-btn ${bookmarked ? "active" : ""}`}
                  onClick={() => bookmarked ? removeFromWatchlist(movie.id) : addToWatchlist(movie)}
                  type="button"
                >
                  {bookmarked ? "✓ In Watchlist" : "+ Add to Watchlist"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Trailer Section */}
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

      {/* Unified Streaming & Watch Hub */}
      <div className="watch-download-hub" style={{
        backgroundColor: "#1e293b",
        padding: "24px",
        borderRadius: "14px",
        border: "1px solid #334155",
        margin: "32px 0"
      }}>
        <h3 style={{ color: "#ffffff", fontSize: "1.2rem", marginBottom: "8px" }}>
          🌍 Streaming & Watch Hub
        </h3>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "20px" }}>
          Find full videos, streams, or licensed platforms for <strong>{title}</strong>:
        </p>

       {hasWatchProviders && (
  <div style={{ marginBottom: "18px" }}>
    {[
      { label: "Stream", list: streamProviders, prefix: "stream" },
      { label: "Rent", list: rentProviders, prefix: "rent" },
      { label: "Buy", list: buyProviders, prefix: "buy" },
    ].map(
      ({ label, list, prefix }) =>
        list.length > 0 && (
          <div key={prefix} style={{ marginBottom: "12px" }}>
            <h4 style={{ color: "#cbd5e1", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              {label}
            </h4>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {list.map((provider) => {
                const targetUrl = watchProviders?.link || `https://www.google.com/search?q=${encodeURIComponent(`${title} watch on ${provider.provider_name}`)}`;
                return (
                  <a
                    key={`${prefix}-${provider.provider_id}`}
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Watch ${title} on ${provider.provider_name}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#0f172a",
                      border: "1px solid #475569",
                      borderRadius: "10px",
                      padding: "6px 10px",
                      color: "#f8fafc",
                      textDecoration: "none",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                    }}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                      alt={provider.provider_name}
                      style={{ width: "32px", height: "32px", borderRadius: "7px", objectFit: "cover" }}
                    />
                    <span>{provider.provider_name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )
    )}

    <p style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "6px" }}>
      Provider logos &amp; availability via TMDB &amp; JustWatch
    </p>
  </div>
)}
        {/* Streaming Platforms Row */}
        <div>
          <h4 style={{ color: "#cbd5e1", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
            Available Web Links
          </h4>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {officialPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  backgroundColor: "#0f172a",
                  border: `1px solid ${platform.color}`,
                  color: "#ffffff",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "transform 0.2s ease"
                }}
              >
                <span>{platform.icon}</span>
                <span>{platform.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

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