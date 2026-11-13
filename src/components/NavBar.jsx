import { useState } from "react";
import { NavLink } from "react-router-dom";
import MovieIcon from "../components/MovieIcon";
import { useMovieContext } from "../contexts/MovieContext";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "./AuthModal";
import "../css/Navbar.css";

function NavBar() {
  const { theme, toggleTheme } = useMovieContext();
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <header className="navBar">
        <div className="nav-brand">
          <NavLink to="/" className="brand-link">
            <MovieIcon size={36} className="navbar-logo" />
            <span>Movie App</span>
          </NavLink>
        </div>

        <nav className="nav-links">
          <NavLink to="/home" end>
            Home
          </NavLink>
          <NavLink to="/favorites">
            Favorites
          </NavLink>
          <NavLink to="/watchlist">
            Watchlist
          </NavLink>
          <NavLink to="/feed">
           Daily Feed
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

          {/* User Auth Section */}
          <div className="auth-nav-section" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            {user ? (
              <div className="user-profile-menu" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span className="user-name" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  👋 Hi, {user.name}
                </span>
                <button 
                  type="button" 
                  className="theme-toggle-btn" 
                  onClick={logout}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="theme-toggle-btn"
                style={{ backgroundColor: "var(--accent-color)", color: "#fff", border: "none" }}
                onClick={() => setIsAuthModalOpen(true)}
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Render the Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}

export default NavBar;