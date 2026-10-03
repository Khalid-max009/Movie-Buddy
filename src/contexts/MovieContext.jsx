 import { createContext, useState, useContext, useEffect } from "react";

const MovieContext = createContext();

export const useMovieContext = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
  // Initialize favorites state directly from LocalStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const localData = localStorage.getItem("app_favorites");
      return localData ? JSON.parse(localData) : [];
    } catch (err) {
      console.error("Failed to load favorites from localStorage:", err);
      return [];
    }
  });

  // Initialize watchlist state directly from LocalStorage
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const localData = localStorage.getItem("app_watchlist");
      return localData ? JSON.parse(localData) : [];
    } catch (err) {
      console.error("Failed to load watchlist from localStorage:", err);
      return [];
    }
  });

  // Toast state and helper
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // 1. State initialization
const [theme, setTheme] = useState(() => {
  return localStorage.getItem("app_theme") || "dark";
});

// 2. DOM Sync (DO NOT call setTheme in here!)
useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("app_theme", theme);
}, [theme]);

// 3. Toggle Function
const toggleTheme = () => {
  setTheme((prev) => (prev === "dark" ? "light" : "dark"));
};

   // Toast auto-dismiss timer
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("app_favorites", JSON.stringify(favorites));
    } catch (err) {
      console.error("Failed to save favorites to localStorage:", err);
    }
  }, [favorites]);

  // Sync watchlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("app_watchlist", JSON.stringify(watchlist));
    } catch (err) {
      console.error("Failed to save watchlist to localStorage:", err);
    }
  }, [watchlist]);

  // Favorite Handlers
  const addToFavorites = (movie) => {
    setFavorites((prev) => {
      if (prev.some((m) => Number(m.id) === Number(movie.id))) return prev;
      return [...prev, movie];
    });
    showToast(`Added "${movie.title}" to Favorites!`, "success");
  };

  const removeFromFavorites = (movieId) => {
    const targetId = Number(movieId);
    
    // 1. Find the movie BEFORE filtering it out
    const movieToRemove = favorites.find((movie) => Number(movie.id) === targetId);

    // 2. Remove from state
    setFavorites((prev) => prev.filter((movie) => Number(movie.id) !== targetId));

    // 3. Trigger toast using retrieved title
    const title = movieToRemove ? movieToRemove.title : "Movie";
    showToast(`Removed "${title}" from Favorites`, "info");
  };

  const isFavorite = (movieId) => {
    return favorites.some((movie) => Number(movie.id) === Number(movieId));
  };

  // Watchlist Handlers
  const addToWatchlist = (movie) => {
    setWatchlist((prev) => {
      if (prev.some((m) => Number(m.id) === Number(movie.id))) return prev;
      return [...prev, { ...movie, watched: false }];
    });
    showToast(`Added "${movie.title}" to Watchlist!`, "success");
  };

  const removeFromWatchlist = (movieId) => {
    const targetId = Number(movieId);

    // 1. Find the movie BEFORE filtering it out
    const movieToRemove = watchlist.find((movie) => Number(movie.id) === targetId);

    // 2. Remove from state
    setWatchlist((prev) => prev.filter((movie) => Number(movie.id) !== targetId));

    // 3. Trigger toast using retrieved title
    const title = movieToRemove ? movieToRemove.title : "Movie";
    showToast(`Removed "${title}" from Watchlist`, "info");
  };

  const inWatchlist = (movieId) => {
    return watchlist.some((movie) => Number(movie.id) === Number(movieId));
  };

  // Toggle Watched Status inside Watchlist
  const toggleWatched = (movieId) => {
    const targetId = Number(movieId);
    const targetMovie = watchlist.find((m) => Number(m.id) === targetId);

    if (targetMovie) {
      const nextWatchedState = !targetMovie.watched;
      showToast(
        `Marked "${targetMovie.title}" as ${nextWatchedState ? "Watched" : "Not Watched"}`,
        "info"
      );
    }

    setWatchlist((prev) =>
      prev.map((movie) =>
        Number(movie.id) === targetId
          ? { ...movie, watched: !movie.watched }
          : movie
      )
    );
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    inWatchlist,
    toggleWatched,
    toast,
    theme,
    toggleTheme,
  };

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
};