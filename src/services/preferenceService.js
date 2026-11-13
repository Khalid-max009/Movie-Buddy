// Map common search terms to TMDB Genre IDs for targeted discovery
const GENRE_KEYWORD_MAP = {
  action: 28,
  adventure: 12,
  animation: 16,
  anime: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "sci-fi": 878,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
  "k-drama": 18,
  kdrama: 18,
  korean: 18
};

/**
 * Extracts top search topics and infer genre IDs from local chat history & watchlist
 */
export function getUserPreferences() {
  // 1. Pull chat history from localStorage
  const rawHistory = localStorage.getItem("moviebuddy_chat_history");
  const chatMessages = rawHistory ? JSON.parse(rawHistory) : [];

  // Filter user prompts
  const userPrompts = chatMessages
    .filter((msg) => msg.sender === "user")
    .map((msg) => msg.text.toLowerCase());

  // Determine the most recent search query for the "Based on your search history" row
  const latestSearchQuery = userPrompts.length > 0 ? userPrompts[userPrompts.length - 1] : null;

  // 2. Extract matching genre IDs from recent user queries
  const detectedGenreIds = new Set();
  userPrompts.forEach((prompt) => {
    Object.keys(GENRE_KEYWORD_MAP).forEach((keyword) => {
      if (prompt.includes(keyword)) {
        detectedGenreIds.add(GENRE_KEYWORD_MAP[keyword]);
      }
    });
  });

  // Default fallback genres (Action & Sci-Fi) if user history is empty
  const genreList = detectedGenreIds.size > 0 ? Array.from(detectedGenreIds) : [28, 878];

  return {
    latestSearchQuery,
    preferredGenres: genreList
  };
}