import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

const MovieContext = createContext();

export const useMovieContext = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
  // Initialize favorites state directly from LocalStorage for instant loading
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

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Toast auto-dismiss timer
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync favorites to localStorage instantly
  useEffect(() => {
    try {
      localStorage.setItem("app_favorites", JSON.stringify(favorites));
    } catch (err) {
      console.error("Failed to save favorites to localStorage:", err);
    }
  }, [favorites]);

  // Sync watchlist to localStorage instantly
  useEffect(() => {
    try {
      localStorage.setItem("app_watchlist", JSON.stringify(watchlist));
    } catch (err) {
      console.error("Failed to save watchlist to localStorage:", err);
    }
  }, [watchlist]);

  // Optional background cloud sync (Non-blocking, safe from infinite hangs)
  const syncToCloudInBackground = async (updatedFavorites, updatedWatchlist) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await supabase
        .from("profiles")
        .update({
          favorites: updatedFavorites,
          watchlist: updatedWatchlist,
          updated_at: new Date(),
        })
        .eq("id", session.user.id);
    } catch (err) {
      console.warn("Background cloud sync skipped or offline:", err.message);
    }
  };

  // Favorite Handlers
  const addToFavorites = (movie) => {
    let updated;
    setFavorites((prev) => {
      if (prev.some((m) => Number(m.id) === Number(movie.id))) return prev;
      updated = [...prev, movie];
      return updated;
    });
    if (updated) {
      syncToCloudInBackground(updated, watchlist);
      showToast(`Added "${movie.title}" to Favorites!`, "success");
    }
  };

  const removeFromFavorites = (movieId) => {
    const targetId = Number(movieId);
    const movieToRemove = favorites.find((movie) => Number(movie.id) === targetId);

    let updated;
    setFavorites((prev) => {
      updated = prev.filter((movie) => Number(movie.id) !== targetId);
      return updated;
    });

    if (updated) {
      syncToCloudInBackground(updated, watchlist);
      const title = movieToRemove ? movieToRemove.title : "Movie";
      showToast(`Removed "${title}" from Favorites`, "info");
    }
  };

  const isFavorite = (movieId) => {
    return favorites.some((movie) => Number(movie.id) === Number(movieId));
  };

  // Watchlist Handlers
  const addToWatchlist = (movie) => {
    let updated;
    setWatchlist((prev) => {
      if (prev.some((m) => Number(m.id) === Number(movie.id))) return prev;
      updated = [...prev, { ...movie, watched: false }];
      return updated;
    });
    if (updated) {
      syncToCloudInBackground(favorites, updated);
      showToast(`Added "${movie.title}" to Watchlist!`, "success");
    }
  };

  const removeFromWatchlist = (movieId) => {
    const targetId = Number(movieId);
    const movieToRemove = watchlist.find((movie) => Number(movie.id) === targetId);

    let updated;
    setWatchlist((prev) => {
      updated = prev.filter((movie) => Number(movie.id) !== targetId);
      return updated;
    });

    if (updated) {
      syncToCloudInBackground(favorites, updated);
      const title = movieToRemove ? movieToRemove.title : "Movie";
      showToast(`Removed "${title}" from Watchlist`, "info");
    }
  };

  const inWatchlist = (movieId) => {
    return watchlist.some((movie) => Number(movie.id) === Number(movieId));
  };

  /// Toggle Watched Status inside Watchlist
  const toggleWatched = (movieOrId) => {
    const targetId =
      typeof movieOrId === "object" && movieOrId !== null
        ? Number(movieOrId.id)
        : Number(movieOrId);

    const targetMovie = watchlist.find((m) => Number(m.id) === targetId);

    if (targetMovie) {
      const nextWatchedState = !targetMovie.watched;
      const displayTitle =
        targetMovie.title ||
        targetMovie.name ||
        targetMovie.original_title ||
        targetMovie.original_name ||
        "Movie";

      showToast(
        `Marked "${displayTitle}" as ${nextWatchedState ? "Watched" : "Not Watched"}`,
        "info"
      );
    }

    let updated;
    setWatchlist((prev) => {
      updated = prev.map((movie) =>
        Number(movie.id) === targetId
          ? { ...movie, watched: !movie.watched }
          : movie
      );
      return updated;
    });

    if (updated) {
      syncToCloudInBackground(favorites, updated);
    }
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