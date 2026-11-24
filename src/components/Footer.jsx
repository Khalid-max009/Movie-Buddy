import { Link } from "react-router-dom";
import "../css/Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mb-footer">
      <div className="mb-footer-inner">
        <div className="mb-footer-top">
          <div className="mb-footer-brand">
            <span className="mb-footer-logo">MovieBuddy</span>
            <p className="mb-footer-tagline">
              Movie &amp; series discovery, watchlist tracking, saving Favourites, and AI recommendations.
            </p>
          </div>

          <nav className="mb-footer-links" aria-label="Footer navigation">
            <Link to="/">Home</Link>
            <Link to="/watchlist">Watchlist</Link>
            <Link to="/favorites">Favorites</Link>
            <Link to="/team">Team &amp; Alerts</Link>
          </nav>
        </div>

        <div className="mb-footer-divider" />

        <div className="mb-footer-bottom">
          <p className="mb-footer-credits">
            © {currentYear} <strong>MovieBuddy</strong> • Built &amp; Engineered by{" "}
            <strong>Khalid</strong> | Growth &amp; Community by <strong>Muhammad Faizan</strong>
          </p>
          <p className="mb-footer-legal">
            Discovery &amp; tracking only — we do not host or distribute video streams or
            downloads. Movie data &amp; images provided by{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
            >
              TMDB
            </a>
            ; this product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}