import { useState, useEffect } from "react";
import MovieCardSkeleton from "../components/MovieCardSkeleton";
import MovieCard from "../components/MovieCard";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../contexts/AuthContext";
import {
  searchMovie,
  getPopularMovie,
  getGenres,
  getMoviesByGenre,
  getFilteredMedia
} from "../services/api";
import "../css/Home.css";

const COUNTRIES = [
  { code: "", name: "Global / Popular", flag: "" },
  { code: "NG", name: "Nigeria", flag: "NG" },
  { code: "ZA", name: "South Africa", flag: "ZA" },
  { code: "US", name: "USA", flag: "us" },
  { code: "GB", name: "United Kingdom", flag: "GB" },
  { code: "KR", name: "South Korea", flag: "KR" },
  { code: "IN", name: "India", flag: "IN" },
  { code: "LS", name: "Lesotho", flag: "LS" },
  { code: "KP", name: "North Korea", flag: "KP" },
  { code: "JP", name: "Japan", flag: "JP" },
  { code: "CN", name: "China", flag: "CN" },
  { code: "PK", name: "Pakistan", flag: "PK" },
  { code: "EG", name: "Egypt", flag: "EG" },
  { code: "TN", name: "Tunisia", flag: "TN" },
  { code: "MA", name: "Morocco", flag: "MA" },
  { code: "PH", name: "Philippines", flag: "PH" }
];

const YEARS = [
  { code: "", label: "All Years" },
  { code: "2026", label: "2026 (Latest)" },
  { code: "2025", label: "2025" },
  { code: "2024", label: "2024" },
  { code: "2023", label: "2023" },
  { code: "2022", label: "2022" },
];

function Home() {
  const { user, preferences } = useAuth();

  // Initialize state from sessionStorage if available to preserve history state
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("mb_search") || "");
  const [movies, setMovies] = useState(() => {
    const saved = sessionStorage.getItem("mb_movies");
    return saved ? JSON.parse(saved) : [];
  });
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem("mb_page");
    return saved ? Number(saved) : 1;
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Sidebar & Filter State
  const [selectedCountry, setSelectedCountry] = useState(() => sessionStorage.getItem("mb_country") || "");
  const [mediaType, setMediaType] = useState(() => sessionStorage.getItem("mb_mediaType") || "movie");
  const [selectedYear, setSelectedYear] = useState(() => sessionStorage.getItem("mb_year") || "");
  const [isPersonalizedView, setIsPersonalizedView] = useState(false);

  // Genre Filtering State
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(() => {
    const saved = sessionStorage.getItem("mb_genre");
    return saved ? JSON.parse(saved) : null;
  });

  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 300);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem("mb_search", searchQuery);
    sessionStorage.setItem("mb_movies", JSON.stringify(movies));
    sessionStorage.setItem("mb_page", page);
    sessionStorage.setItem("mb_country", selectedCountry);
    sessionStorage.setItem("mb_mediaType", mediaType);
    sessionStorage.setItem("mb_year", selectedYear);
    sessionStorage.setItem("mb_genre", JSON.stringify(selectedGenre));
  }, [searchQuery, movies, page, selectedCountry, mediaType, selectedYear, selectedGenre]);

  // Restore scroll position on mount
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("mb_scroll_pos");
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll, 10));
    }

    const handleScroll = () => {
      sessionStorage.setItem("mb_scroll_pos", window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Reset pagination when search input or filters change
  useEffect(() => {
    if (debouncedSearchQuery) {
      setSelectedGenre(null);
      setIsPersonalizedView(false);
      setPage(1);
    }
  }, [debouncedSearchQuery, selectedCountry, selectedYear, mediaType]);

  // Fetch movies/series supporting simultaneous Country, Year, Genre, and Media Type filtering
  useEffect(() => {
    const hasStoredMovies = sessionStorage.getItem("mb_movies");
    if (hasStoredMovies && movies.length > 0 && page === 1 && !debouncedSearchQuery && !selectedGenre && !selectedCountry && !selectedYear && mediaType === "movie" && !isPersonalizedView) {
      sessionStorage.removeItem("mb_movies");
      return;
    }

    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        let newMovies = [];
        if (debouncedSearchQuery) {
          newMovies = await searchMovie(debouncedSearchQuery, page);
        } else if (isPersonalizedView && preferences?.genres?.length > 0) {
          // Fetch using user's primary onboarding genre preference
          const primaryGenre = preferences.genres[0];
          const primaryCountry = preferences.countries?.[0] || selectedCountry;
          newMovies = await getFilteredMedia(mediaType, primaryCountry, selectedYear, primaryGenre, page);
        } else {
          newMovies = await getFilteredMedia(mediaType, selectedCountry, selectedYear, selectedGenre, page);
        }

        if (!newMovies || newMovies.length === 0) {
          setHasMore(false);
          if (page === 1) setMovies([]);
        } else {
          setMovies((prev) => (page === 1 ? newMovies : [...prev, ...newMovies]));
        }
        setHasMore(newMovies ? newMovies.length >= 10 : false);
      } catch (err) {
        console.error(err);
        setError("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page, debouncedSearchQuery, selectedGenre, mediaType, selectedCountry, selectedYear, isPersonalizedView, preferences]);

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

  const handleCountrySelect = (countryCode) => {
    setSearchQuery("");
    setIsPersonalizedView(false);
    setPage(1);
    setSelectedCountry(countryCode === selectedCountry ? "" : countryCode);
  };

  const handleYearSelect = (yearCode) => {
    setSearchQuery("");
    setIsPersonalizedView(false);
    setPage(1);
    setSelectedYear(yearCode === selectedYear ? "" : yearCode);
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    setPage(1);
  };

  const handleGenreSelect = (genreId) => {
    setSearchQuery("");
    setIsPersonalizedView(false);
    setPage(1);
    setSelectedGenre(selectedGenre === genreId ? null : genreId);
  };

  // Handler for AI Recommended For You Pill
  const handlePersonalizedClick = () => {
    setSearchQuery("");
    setSelectedGenre(null);
    setIsPersonalizedView(!isPersonalizedView);
    setPage(1);
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
              Movies
            </button>
            <button
              type="button"
              className={`toggle-btn ${mediaType === "tv" ? "active" : ""}`}
              onClick={() => handleMediaTypeChange("tv")}
            >
              Series
            </button>
          </div>
        </div>

        <div className="sidebar-media-toggle" style={{ marginTop: "20px" }}>
          <h4>Release Year</h4>
          <div className="country-list" style={{ maxHeight: "180px" }}>
            {YEARS.map((y) => (
              <button
                key={y.code}
                type="button"
                className={`country-sidebar-btn ${selectedYear === y.code ? "active" : ""}`}
                onClick={() => handleYearSelect(y.code)}
              >
                <span className="country-name">{y.label}</span>
              </button>
            ))}
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

        {/* Genres & Personalized "For You" Pill Bar */}
        {!debouncedSearchQuery && genres.length > 0 && (
          <div className="genre-container">
            {user && preferences?.genres?.length > 0 && (
              <button
                type="button"
                className={`genre-pill personalized-pill ${isPersonalizedView ? "active" : ""}`}
                onClick={handlePersonalizedClick}
                style={{
                  background: isPersonalizedView ? "#e50914" : "rgba(229, 9, 20, 0.15)",
                  border: "1px solid #e50914",
                  color: "#ffffff",
                  fontWeight: "700"
                }}
              >
                ✨ Recommended For You
              </button>
            )}

            <button
              type="button"
              className={`genre-pill ${selectedGenre === null && !isPersonalizedView ? "active" : ""}`}
              onClick={() => handleGenreSelect(null)}
            >
              All Genres
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className={`genre-pill ${selectedGenre === genre.id && !isPersonalizedView ? "active" : ""}`}
                onClick={() => handleGenreSelect(genre.id)}
              >
                {genre.name}
              </button>
            ))}
          </div>
        )}

        {/* Personalized Banner Feedback */}
        {isPersonalizedView && user && (
          <div className="personalized-banner" style={{
            background: "rgba(30, 41, 59, 0.7)",
            borderLeft: "4px solid #e50914",
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "20px",
            color: "#f8fafc",
            fontSize: "0.95rem"
          }}>
            🎯 Showing curated picks for <strong>{user.name}</strong> based on your favorite genres!
          </div>
        )}

        {/* Movie Grid */}
        <div className="movies-grid">
          {loading && page === 1 && movies.length === 0 ? (
            Array.from({ length: 10 }).map((_, index) => (
              <MovieCardSkeleton key={index} />
            ))
          ) : (
            movies.map((movie, index) => (
              <MovieCard
                key={`${movie.id}-${index}`}
                movie={movie}
                mediaType={movie.media_type || mediaType}
              />
            ))
          )}
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