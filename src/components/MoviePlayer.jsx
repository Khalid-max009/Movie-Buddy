import React, { useState } from 'react';
import '../css/MoviePlayer.css';

const MoviePlayer = ({ movieId, mediaType = 'movie', title = '' }) => {
  const [isActivated, setIsActivated] = useState(false);
  const [serverSource, setServerSource] = useState('vidsrc.cc'); // Default fast server

  // 1. Build correct streaming URL based on media type & server
  const getEmbedUrl = () => {
    if (serverSource === 'vidsrc.cc') {
      return mediaType === 'tv'
        ? `https://vidsrc.cc/v2/embed/tv/${movieId}/1/1` // Defaults to Season 1 Episode 1
        : `https://vidsrc.cc/v2/embed/movie/${movieId}`;
    }
    
    // Fallback Server: vidsrc.me
    return mediaType === 'tv'
      ? `https://vidsrc.me/embed/tv?tmdb=${movieId}&season=1&episode=1`
      : `https://vidsrc.me/embed/movie?tmdb=${movieId}`;
  };

  return (
    <div className="movie-player-container">
      {/* Server Selector Bar */}
      <div className="server-selector-bar" style={{ padding: '8px 12px', background: '#12121c', display: 'flex', gap: '10px', alignItems: 'center' }}>
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

      {!isActivated ? (
        /* Safe Overlay to block initial clickjacking */
        <div className="player-overlay" onClick={() => setIsActivated(true)}>
          <div className="play-button-icon">▶</div>
          <h3 className="overlay-title">Watch {title ? `"${title}"` : 'Now'}</h3>
          <p className="overlay-subtitle">Click to Initialize Stream Player</p>
        </div>
      ) : (
        /* Unrestricted Iframe (Fixes the blank / blocked player issue) */
        <iframe
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