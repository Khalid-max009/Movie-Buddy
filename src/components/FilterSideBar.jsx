import React from 'react';
import '../css/FilterSidebar.css';

const COUNTRIES = [
  { id: 'all', label: 'All Regions', code: '' },
  { id: 'ng', label: 'Nollywood (Nigeria)', code: 'NG' },
  { id: 'us', label: 'Hollywood (USA)', code: 'US' },
  { id: 'kr', label: 'Korea', code: 'KR' },
  { id: 'cn', label: 'China', code: 'CN' },
  { id: 'ph', label: 'Philippines', code: 'PH' }
];

const YEARS = [
  { id: 'all', label: 'All Years', value: '' },
  { id: '2026', label: '2026 (Latest)', value: '2026' },
  { id: '2025', label: '2025', value: '2025' },
  { id: '2024', label: '2024', value: '2024' },
  { id: '2023', label: '2023', value: '2023' },
];



export default function FilterSidebar({ 
  selectedCountry, 
  setSelectedCountry, 
  selectedYear, 
  setSelectedYear,
  mediaType, 
  setMediaType, 
  isOpen, 
  onClose 
}) {
  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`filter-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Browse Categories</h3>
          <button className="close-sidebar-btn" onClick={onClose}>✕</button>
        </div>

        {/* 1. Format Switcher (Movies vs Series) */}
        <div className="filter-section">
          <label className="filter-label">Content Type</label>
          <div className="format-toggle-group">
            <button
              type="button"
              className={`format-btn ${mediaType === 'movie' ? 'active' : ''}`}
              onClick={() => {
                setMediaType('movie');
                onClose();
              }}
            >
              Movies
            </button>
            <button
              type="button"
              className={`format-btn ${mediaType === 'tv' ? 'active' : ''}`}
              onClick={() => {
                setMediaType('tv');
                onClose();
              }}
            >
              Series
            </button>
          </div>
        </div>

        {/* 2. Country / Region Selector */}
        <div className="filter-section">
          <label className="filter-label">Countries & Regions</label>
          <ul className="country-list">
            {COUNTRIES.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`country-btn ${selectedCountry === c.code ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCountry(c.code);
                    onClose();
                  }}
                >
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>


        <div className="filter-section">
        <label className="filter-label">Release Year</label>
        <div className="country-list">
          {YEARS.map((y) => (
            <button
              key={y.id}
              type="button"
              className={`country-btn ${selectedYear === y.value ? 'active' : ''}`}
              onClick={() => {
                setSelectedYear(y.value);
                onClose();
              }}
            >
              {y.label}
            </button>
          ))}
        </div>
      </div>
      </aside>
    </>
  );
}