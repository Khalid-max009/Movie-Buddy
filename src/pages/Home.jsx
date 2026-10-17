import { useState, useEffect } from "react";
import MovieCardSkeleton from "../components/MovieCardSkeleton";
import MovieCard from "../components/MovieCard";
import { useDebounce } from "../hooks/useDebounce";
import { 
  searchMovie, 
  getPopularMovie, 
  getGenres, 
  getMoviesByGenre, 
  getFilteredMedia 
} from "../services/api";
import "../css/Home.css";

const COUNTRIES = [
  { code: "", name: "Global / Popular", flag: "🌍" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "KP", name: "North Korea", flag: "🇰🇵" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "CN", name: "China", flag: "CN" }, // flag property preserved
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
];

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Sidebar & Filter State
  const [selectedCountry, setSelectedCountry] = useState(""); // "" for Global
  const [mediaType, setMediaType] = useState("movie"); // "movie" or "tv"
  
  // Genre Filtering State
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 300);

  // Fetch genre list on mount
  useEffect(() => {
    const fetchGenresList = async () => {
      try {
        const genreList = await getGenres();
        setGenres(genreList || []);
      } catch (err) {
        console.error("Failed to load genres:", err);
      }
    };
    fetchGenresList();
  }, []);

  // Reset pagination & genre selection when search input or filters change
  useEffect(() => {
    if (debouncedSearchQuery) {
      setSelectedGenre(null);
    }
    setPage(1);
  }, [debouncedSearchQuery, selectedCountry, mediaType]);

  // Fetch movies/series whenever page, debounced query, selected genre, mediaType, or selectedCountry changes
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        let newMovies = [];

        if (debouncedSearchQuery) {
          newMovies = await searchMovie(debouncedSearchQuery, page);
        } else if (selectedGenre) {
          newMovies = await getMoviesByGenre(selectedGenre, page);
        } else if (selectedCountry || mediaType === "tv") {
          newMovies = await getFilteredMedia(mediaType, selectedCountry, page);
        } else {
          newMovies = await getPopularMovie(page);
        }

        if (!newMovies || newMovies.length === 0) {
          setHasMore(false);
          if (page === 1) setMovies([]);
        } else {
          setMovies((prev) => (page === 1 ? newMovies : [...prev, ...newMovies]));
          setHasMore(newMovies.length >= 10);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page, debouncedSearchQuery, selectedGenre, mediaType, selectedCountry]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || loading) return;
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  // When a country sidebar button is clicked
  const handleCountrySelect = (countryCode) => {
    setSearchQuery("");
    setActiveQuery("");
    setSelectedGenre(null);
    setPage(1);
    setSelectedCountry(countryCode);
  };

  // When media format toggle button is clicked (Movies vs Series)
  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    setPage(1);
  };

  // When a genre pill is clicked
  const handleGenreSelect = (genreId) => {
    setSearchQuery("");
    setActiveQuery("");
    setPage(1);

    if (selectedGenre === genreId) {
      setSelectedGenre(null);
    } else {
      setSelectedGenre(genreId);
    }
  };

  return (
    <div className="home-container home-layout-wrapper">
      {/* Sidebar Filter Component */}
      <aside className="filter-sidebar">
        <h3>Filter by Country</h3>
        <div className="country-list">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`country-sidebar-btn ${selectedCountry === c.code ? "active" : ""}`}
              onClick={() => handleCountrySelect(c.code)}
            >
              <span className="flag">{c.flag}</span>
              <span className="country-name">{c.name}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-media-toggle">
          <h4>Media Format</h4>
          <div className="toggle-buttons">
            <button
              type="button"
              className={`toggle-btn ${mediaType === "movie" ? "active" : ""}`}
              onClick={() => handleMediaTypeChange("movie")}
            >
              🎬 Movies
            </button>
            <button
              type="button"
              className={`toggle-btn ${mediaType === "tv" ? "active" : ""}`}
              onClick={() => handleMediaTypeChange("tv")}
            >
              📺 Series
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="home-main-content">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search for movies or series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {/* Genre Filter Pills */}
        {!debouncedSearchQuery && genres.length > 0 && (
          <div className="genre-container">
            <button
              type="button"
              className={`genre-pill ${selectedGenre === null ? "active" : ""}`}
              onClick={() => handleGenreSelect(null)}
            >
              All Genres
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={`genre-pill ${selectedGenre === genre.id ? "active" : ""}`}
                onClick={() => handleGenreSelect(genre.id)}
              >
                {genre.name}
              </button>
            ))}
          </div>
        )}

        {/* Movie Grid */}
        <div className="movies-grid">
          {loading && page === 1
            ? Array.from({ length: 10 }).map((_, index) => (
                <MovieCardSkeleton key={index} />
              ))
            : movies.map((movie, index) => (
                <MovieCard key={`${movie.id}-${index}`} movie={movie} mediaType={mediaType} />
              ))}

          {loading && page > 1 &&
            Array.from({ length: 5 }).map((_, index) => (
              <MovieCardSkeleton key={`more-skeleton-${index}`} />
            ))}
        </div>

        {!loading && hasMore && movies.length > 0 && (
          <div className="load-more-container">
            <button onClick={handleLoadMore} className="load-more-btn" type="button">
              Load More Content
            </button>
          </div>
        )}

        {!loading && movies.length === 0 && !error && (
          <p className="no-results">No titles found matching your selection.</p>
        )}
      </div>
    </div>
  );
}

export default Home;