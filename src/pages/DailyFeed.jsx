import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserPreferences } from "../services/preferenceService";
import "../css/DailyFeed.css";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export default function DailyFeed() {
  const [loading, setLoading] = useState(true);
  const [dailyHero, setDailyHero] = useState(null);
  const [basedOnSearchHistory, setBasedOnSearchHistory] = useState({ keyword: "", items: [] });
  const [genrePicks, setGenrePicks] = useState([]);
  const [freshHits, setFreshHits] = useState([]);
  
  // NEW FEED ROWS
  const [hiddenGems, setHiddenGems] = useState([]);
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [nostalgiaNook, setNostalgiaNook] = useState([]);

  useEffect(() => {
    fetchInitialFeedData();
  }, []);

  const fetchInitialFeedData = async () => {
    setLoading(true);
    try {
      const { latestSearchQuery, preferredGenres } = getUserPreferences();

      // 1. Fetch Daily Hero
      const heroRes = await fetch(`${BASE_URL}/trending/all/day?api_key=${API_KEY}`);
      const heroData = await heroRes.json();
      if (heroData.results && heroData.results.length > 0) {
        setDailyHero(heroData.results[0]);
      }

      // 2. Based on Search History
      const activeKeyword = latestSearchQuery || "Korean Thrillers";
      const searchRes = await fetch(
        `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(activeKeyword)}`
      );
      const searchData = await searchRes.json();
      setBasedOnSearchHistory({
        keyword: activeKeyword,
        items: searchData.results
          ? searchData.results.filter((item) => item.poster_path).slice(0, 8)
          : []
      });

      // 3. Top Picks in Favorite Genres
      const genreIdsString = preferredGenres.join(",");
      const genreRes = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreIdsString}&sort_by=vote_average.desc&vote_count.gte=500`
      );
      const genreData = await genreRes.json();
      setGenrePicks(genreData.results ? genreData.results.slice(0, 8) : []);

      // 4. Fresh Hits
      const freshRes = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
      const freshData = await freshRes.json();
      setFreshHits(freshData.results ? freshData.results.slice(0, 8) : []);

      // 5. NEW: Hidden Gems (High score > 7.8, moderate vote count)
      const gemsRes = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&vote_average.gte=7.8&vote_count.gte=100&vote_count.lte=2000&sort_by=vote_average.desc`
      );
      const gemsData = await gemsRes.json();
      setHiddenGems(gemsData.results ? gemsData.results.slice(0, 8) : []);

      // 6. NEW: Binge-Worthy TV Series
      const seriesRes = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}`);
      const seriesData = await seriesRes.json();
      setTrendingSeries(seriesData.results ? seriesData.results.slice(0, 8) : []);

      // 7. NEW: Nostalgia Nook (Top Classics 2010–2018)
      const retroRes = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=2010-01-01&primary_release_date.lte=2018-12-31&sort_by=popularity.desc`
      );
      const retroData = await retroRes.json();
      setNostalgiaNook(retroData.results ? retroData.results.slice(0, 8) : []);

    } catch (err) {
      console.error("Failed to load Daily Feed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="daily-feed-container">
        <div className="skeleton-hero" />
        <div className="feed-section">
          <div className="skeleton-card-row" style={{ display: "flex", gap: "16px" }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const heroTitle = dailyHero?.title || dailyHero?.name;
  const heroMedia = dailyHero?.media_type === "tv" || dailyHero?.first_air_date ? "tv" : "movie";
  const heroYear = (dailyHero?.release_date || dailyHero?.first_air_date)?.slice(0, 4) || "N/A";

  return (
    <div className="daily-feed-container">
      
      {/* Hero Showcase */}
      {dailyHero && (
        <div 
          className="feed-hero" 
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${dailyHero.backdrop_path})` }}
        >
          <div className="feed-hero-overlay">
            <span className="hero-tag">✨ Daily Pick For You</span>
            <h1>{heroTitle}</h1>
            <div className="feed-hero-meta">
              <span>⭐ {dailyHero.vote_average?.toFixed(1)}</span>
              <span>{heroYear}</span>
              <span>{heroMedia === "tv" ? "📺 Series" : "🎬 Movie"}</span>
            </div>
            <p className="feed-hero-overview">{dailyHero.overview}</p>
            <Link to={`/${heroMedia}/${dailyHero.id}`}>
              <button type="button" className="hero-btn">View Details</button>
            </Link>
          </div>
        </div>
      )}

      {/* Row 1: Search History */}
      {basedOnSearchHistory.items.length > 0 && (
        <div className="feed-section">
          <h2 className="feed-section-title">
            🔍 Based on your search history: <span style={{ color: "#dc2626", marginLeft: "6px" }}>"{basedOnSearchHistory.keyword}"</span>
          </h2>
          <div className="feed-row">
            {basedOnSearchHistory.items.map((item) => (
              <RenderFeedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Row 2: Top Genre Picks */}
      {genrePicks.length > 0 && (
        <div className="feed-section">
          <h2 className="feed-section-title">🔥 Top Picks in Your Favorite Genres</h2>
          <div className="feed-row">
            {genrePicks.map((item) => (
              <RenderFeedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Fresh Hits */}
      {freshHits.length > 0 && (
        <div className="feed-section">
          <h2 className="feed-section-title">🍿 Fresh Hits & Trending Releases</h2>
          <div className="feed-row">
            {freshHits.map((item) => (
              <RenderFeedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Row 4: Trending TV Series */}
      {trendingSeries.length > 0 && (
        <div className="feed-section">
          <h2 className="feed-section-title">📺 Binge-Worthy TV Series Right Now</h2>
          <div className="feed-row">
            {trendingSeries.map((item) => (
              <RenderFeedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Row 5: Hidden Gems */}
      {hiddenGems.length > 0 && (
        <div className="feed-section">
          <h2 className="feed-section-title">💎 Hidden Gems (Highly Rated & Underrated)</h2>
          <div className="feed-row">
            {hiddenGems.map((item) => (
              <RenderFeedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Row 6: Nostalgia Vault */}
      {nostalgiaNook.length > 0 && (
        <div className="feed-section">
          <h2 className="feed-section-title">⏳ Nostalgia Vault: Modern Classics (2010s)</h2>
          <div className="feed-row">
            {nostalgiaNook.map((item) => (
              <RenderFeedCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function RenderFeedCard({ item }) {
  const mediaTypePath = item.first_air_date || item.name ? "tv" : "movie";
  const displayTitle = item.title || item.name;
  const releaseYear = (item.release_date || item.first_air_date)?.slice(0, 4) || "N/A";

  return (
    <Link to={`/${mediaTypePath}/${item.id}`} className="feed-card">
      <img
        src={
          item.poster_path
            ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
            : "https://via.placeholder.com/170x240?text=No+Cover"
        }
        alt={displayTitle}
        className="feed-card-poster"
      />
      <div className="feed-card-info">
        <h4>{displayTitle}</h4>
        <div className="feed-card-meta">
          ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"} | {releaseYear}
        </div>
      </div>
    </Link>
  );
}