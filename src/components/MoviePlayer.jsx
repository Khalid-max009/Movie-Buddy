 import { useState, useEffect } from 'react';
import '../css/MoviePlayer.css';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const MoviePlayer = ({ movieId, mediaType = 'movie', title = '' }) => {
  const [isActivated, setIsActivated] = useState(false);
  const [serverSource, setServerSource] = useState('vidsrc.cc'); // Default fast server

  // TV Series specific states
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  // 1. Fetch available seasons if it's a TV series
  useEffect(() => {
    if (mediaType === 'tv') {
      const fetchTvDetails = async () => {
        try {
          const res = await fetch(`${BASE_URL}/tv/${movieId}?api_key=${API_KEY}`);
          const data = await res.json();
          const validSeasons = data.seasons ? data.seasons.filter(s => s.season_number > 0) : [];
          setSeasons(validSeasons);
          
          if (validSeasons.length > 0) {
            setSelectedSeason(validSeasons[0].season_number);
          }
        } catch (err) {
          console.error("Error fetching TV seasons:", err);
        }
      };
      fetchTvDetails();
    }
  }, [movieId, mediaType]);

  // 2. Fetch episodes whenever the selected season changes
  useEffect(() => {
    if (mediaType === 'tv' && selectedSeason) {
      const fetchEpisodes = async () => {
        try {
          const res = await fetch(`${BASE_URL}/tv/${movieId}/season/${selectedSeason}?api_key=${API_KEY}`);
          const data = await res.json();
          setEpisodes(data.episodes || []);
          
          if (data.episodes && data.episodes.length > 0) {
            setSelectedEpisode(data.episodes[0].episode_number);
          }
        } catch (err) {
          console.error("Error fetching episodes:", err);
        }
      };
      fetchEpisodes();
    }
  }, [movieId, mediaType, selectedSeason]);

  // 3. Build correct streaming URL based on media type, server, and active season/episode
  const getEmbedUrl = () => {
    if (serverSource === 'vidsrc.cc') {
      return mediaType === 'tv'
        ? `https://vidsrc.cc/v2/embed/tv/${movieId}/${selectedSeason}/${selectedEpisode}`
        : `https://vidsrc.cc/v2/embed/movie/${movieId}`;
    }
    
    // Fallback Server: vidsrc.me
    return mediaType === 'tv'
      ? `https://vidsrc.me/embed/tv?tmdb=${movieId}&season=${selectedSeason}&episode=${selectedEpisode}`
      : `https://vidsrc.me/embed/movie?tmdb=${movieId}`;
  };

  return (
    <div className="movie-player-container">
      {/* Server Selector Bar */}
      <div className="server-selector-bar" style={{ padding: '8px 12px', background: '#12121c', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#aaa', fontSize: '13px' }}>Server Source:</span>
        <button 
          onClick={() => setServerSource('vidsrc.cc')}
          style={{ padding: '4px 10px', background: serverSource === 'vidsrc.cc' ? '#ff3b30' : '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
        >
          Server 1 (VidSrc.cc)
        </button>
        <button 
          onClick={() => setServerSource('vidsrc.me')}
          style={{ padding: '4px 10px', background: serverSource === 'vidsrc.me' ? '#ff3b30' : '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
        >
          Server 2 (VidSrc.me)
        </button>
      </div>

      {/* Season & Episode Selector Bar (Only rendered for TV Shows) */}
      {mediaType === 'tv' && (
        <div className="tv-selectors-bar" style={{ padding: '10px 12px', background: '#0d0d14', display: 'flex', gap: '15px', alignItems: 'center', borderTop: '1px solid #1a1a24', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#aaa', fontSize: '13px' }}>Season:</span>
            <select 
              value={selectedSeason} 
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              style={{ padding: '6px 10px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.season_number}>
                  {season.name || `Season ${season.season_number}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#aaa', fontSize: '13px' }}>Episode:</span>
            <select 
              value={selectedEpisode} 
              onChange={(e) => setSelectedEpisode(Number(e.target.value))}
              style={{ padding: '6px 10px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px', outline: 'none', maxWidth: '220px', cursor: 'pointer' }}
            >
              {episodes.map((ep) => (
                <option key={ep.id} value={ep.episode_number}>
                  {ep.episode_number}. {ep.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!isActivated ? (
        /* Safe Overlay to block initial clickjacking */
        <div className="player-overlay" onClick={() => setIsActivated(true)}>
          <div className="play-button-icon">▶</div>
          <h3 className="overlay-title">
            {mediaType === 'tv' 
              ? `Watch S${selectedSeason} E${selectedEpisode} - ${title ? `"${title}"` : 'Now'}` 
              : `Watch ${title ? `"${title}"` : 'Now'}`}
          </h3>
          <p className="overlay-subtitle">Click to Initialize Stream Player</p>
        </div>
      ) : (
        /* Unrestricted Iframe */
        <iframe
          key={`${selectedSeason}-${selectedEpisode}-${serverSource}`}
          src={getEmbedUrl()}
          title={title || 'Movie Stream Player'}
          className="player-iframe"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          allowFullScreen
          allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
        />
      )}
    </div>
  );
};

export default MoviePlayer;