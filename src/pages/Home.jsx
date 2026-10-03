 import { useState, useEffect } from "react";
import MovieCardSkeleton from "../components/MovieCardSkeleton";
import MovieCard from "../components/MovieCard";
import { useDebounce } from "../hooks/useDebounce";
import { searchMovie, getPopularMovie, getGenres, getMoviesByGenre } from "../services/api";
import "../css/Home.css";

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

useEffect(() => {
    if (debouncedSearchQuery) {
      setSelectedGenre(null);
    }
    setPage(1);
  }, [debouncedSearchQuery]);

  // Fetch movies whenever page, debounced query, or selected genre changes
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
        setError("Failed to load movies. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page, debouncedSearchQuery, selectedGenre]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || loading) {
      alert('Another foolish user is trying to search for nothing. Please enter a valid search term.');
      return;
    };
    if (loading) return;

    // Reset genre selection when searching by query keyword
    setSelectedGenre(null);

    // Reset pagination to page 1 for a new query search
    setPage(1);
    setActiveQuery(searchQuery.trim());
  };

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

  // When a genre pill is clicked
  const handleGenreSelect = (genreId) => {
    setSearchQuery(""); // Reset search bar text
    setActiveQuery(""); // Reset active search query
    setPage(1); // Reset page back to 1

    // Toggle genre selection off if already selected
    if (selectedGenre === genreId) {
      setSelectedGenre(null);
    } else {
      setSelectedGenre(genreId);
    }
  };

    return (
    <div className="home-container">
      <form onSubmit={handleSearchSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search for movies..."
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
            className={`genre-pill ${selectedGenre === null ? "active" : ""}`}
            onClick={() => handleGenreSelect(null)}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
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
              <MovieCard movie={movie} key={`${movie.id}-${index}`} />
            ))}

        {loading && page > 1 &&
          Array.from({ length: 5 }).map((_, index) => (
            <MovieCardSkeleton key={`more-skeleton-${index}`} />
          ))}
      </div>

      {!loading && hasMore && movies.length > 0 && (
        <div className="load-more-container">
          <button onClick={handleLoadMore} className="load-more-btn" type="button">
            Load More Movies
          </button>
        </div>
      )}

      {!loading && movies.length === 0 && !error && (
        <p className="no-results">No movies found matching your search.</p>
      )}
    </div>
  );
}

export default Home;