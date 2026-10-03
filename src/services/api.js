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
  const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
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