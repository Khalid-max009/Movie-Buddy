 const API_KEY = import.meta.env.VITE_TMDB_API_KEY  
const BASE_URL = "https://api.themoviedb.org/3"

// Fetch popular movies
 export const getPopularMovie = async (page = 1) => {
  const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`);
  const data = await response.json();
  return data.results;
};
// Search movies
 export const searchMovie = async (query, page = 1) => {
  const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
  const data = await response.json();
  return data.results;
};

// Fetch official YouTube trailer video key for a movie
export const getMovieTrailer = async (movieId) => {
  const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`)
  if (!response.ok) throw new Error('Failed to fetch movie trailer')
  const data = await response.json()
  // Find official trailer on YouTube, or fallback to first available video
  const trailer = data.results.find(
    (vid) => vid.site === "YouTube" && vid.type === "Trailer"
  )
  return trailer ? trailer.key : data.results[0]?.key
}

// Fetch all movie genres for filter pills
export const getGenres = async () => {
  const response = await fetch(
    `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
  );
  const data = await response.json();
  return data.genres;
};

// Fetch movies filtered by a specific genre ID
export const getMoviesByGenre = async (genreId, page = 1) => {
  const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}`);
  const data = await response.json();
  return data.results;
};

// Fetch cast & crew for a movie
export const getMovieCredits = async (movieId) => {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`
  );
  const data = await response.json();
  return data.cast;
};

// Fetch recommendations for a movie
export const getSimilarMovies = async (movieId) => {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/recommendations?api_key=${API_KEY}`
  );
  const data = await response.json();
  return data.results;
};

export const getFilteredMedia = async (mediaType = "movie", countryCode = "", year = "", genreId = null, page = 1) => {
  try {
    let activeGenreId = genreId;

    // TMDB quirk fix: TV Series use ID 10759 for Action & Adventure instead of movie IDs 28/12
    if (mediaType === "tv" && (genreId === 28 || genreId === 12)) {
      activeGenreId = 10759; 
    }

    let url = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc`;

    if (countryCode) {
      url += `&with_origin_country=${countryCode}`;
    }

    if (year) {
      const yearParam = mediaType === "tv" ? "first_air_date_year" : "primary_release_year";
      url += `&${yearParam}=${year}`;
    }

    if (activeGenreId) {
      url += `&with_genres=${activeGenreId}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    // Fallback: If strict multi-filtering (Country + Year + Genre) returns nothing, 
    // drop the year constraint to give the user popular results from that country/genre instead of a blank screen.
    if ((!data.results || data.results.length === 0) && year) {
      let fallbackUrl = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc`;
      if (countryCode) fallbackUrl += `&with_origin_country=${countryCode}`;
      if (activeGenreId) fallbackUrl += `&with_genres=${activeGenreId}`;
      
      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();
      return fallbackData.results || [];
    }

    return data.results || [];
  } catch (error) {
    console.error("Error fetching filtered media:", error);
    return [];
  }
};

export const getWatchProviders = async (mediaType, id) => {
  const response = await fetch(
    `${BASE_URL}/${mediaType}/${id}/watch/providers?api_key=${API_KEY}`
  );
  const data = await response.json();
  // Returns region-specific providers (e.g., US, NG, GB)
  return data.results;
};