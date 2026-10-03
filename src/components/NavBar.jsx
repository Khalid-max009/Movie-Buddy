import { NavLink } from "react-router-dom";
import MovieIcon from "../components/MovieIcon";
import { useMovieContext } from "../contexts/MovieContext";
import "../css/NavBar.css";

function NavBar() {
  const { theme, toggleTheme } = useMovieContext();

  return (
    <header className="navBar">
      <div className="nav-brand">
        <NavLink to="/" className="brand-link">
          <MovieIcon size={36} className="navbar-logo" />
          <span>Movie App</span>
        </NavLink>
      </div>

      <nav className="nav-links">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/favorites">
          Favorites
        </NavLink>
        <NavLink to="/watchlist">
          Watchlist
        </NavLink>

        <button 
          className="theme-toggle-btn" 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
          }}
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </nav>
    </header>
  );
}

export default NavBar;