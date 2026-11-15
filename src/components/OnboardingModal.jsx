import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../css/OnboardingModal.css";

const GENRES = [
  { id: 28, name: "Action 💥" },
  { id: 12, name: "Adventure 🗺️" },
  { id: 16, name: "Animation 🎨" },
  { id: 35, name: "Comedy 😂" },
  { id: 80, name: "Crime 🕵️‍♂️" },
  { id: 18, name: "Drama 🎭" },
  { id: 14, name: "Fantasy 🧙‍♂️" },
  { id: 27, name: "Horror 👻" },
  { id: 9648, name: "Mystery 🔍" },
  { id: 10749, name: "Romance ❤️" },
  { id: 878, name: "Sci-Fi 🚀" },
  { id: 53, name: "Thriller ⚡" },
];

const COUNTRIES = [
   { code: "", name: "Global / Popular", flag: "" },
  { code: "NG", name: "Nigeria", flag: "NG" },
  { code: "ZA", name: "South Africa", flag: "ZA" },
  { code: "US", name: "USA", flag: "us" },
  { code: "GB", name: "United Kingdom", flag: "GB" },
  { code: "KR", name: "South Korea", flag: "KR" },
  { code: "IN", name: "India", flag: "IN" },
  { code: "LS", name: "Lesotho", flag: "LS" },
  { code: "KP", name: "North Korea", flag: "KP" },
  { code: "JP", name: "Japan", flag: "JP" },
  { code: "CN", name: "China", flag: "CN" },
  { code: "PK", name: "Pakistan", flag: "PK" },
  { code: "EG", name: "Egypt", flag: "EG" },
  { code: "TN", name: "Tunisia", flag: "TN" },
  { code: "MA", name: "Morocco", flag: "MA" },
 

];

export default function OnboardingModal({ isOpen, onComplete }) {
  const { savePreferences } = useAuth();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);

  if (!isOpen) return null;

  const toggleGenre = (id) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleCountry = (code) => {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedGenres.length === 0) {
      alert("Please select at least one favorite genre!");
      return;
    }

    savePreferences({
      genres: selectedGenres,
      countries: selectedCountries,
    });
    onComplete();
  };

  return (
    <div className="onboarding-modal-backdrop">
      <div className="onboarding-modal-content">
        <h2>🎬 Welcome to Movie Buddy, Let's Personalize!</h2>
        <p className="onboarding-subtitle">
          Select your favorite genres and production regions so our AI engine can tailor custom movie recommendations just for you.
        </p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="selection-section">
            <label>1. Pick your favorite genres (Choose at least 1):</label>
            <div className="pills-grid">
              {GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre.id);
                return (
                  <button
                    type="button"
                    key={genre.id}
                    className={`preference-pill ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="selection-section">
            <label>2. Preferred regions/countries (Optional):</label>
            <div className="pills-grid">
              {COUNTRIES.map((country) => {
                const isSelected = selectedCountries.includes(country.code);
                return (
                  <button
                    type="button"
                    key={country.code}
                    className={`preference-pill ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleCountry(country.code)}
                  >
                    {country.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="onboarding-submit-btn">
            Save Preferences & Start Exploring 🚀
          </button>
        </form>
      </div>
    </div>
  );
}