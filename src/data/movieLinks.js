// src/data/movieLinks.js

export const MOVIE_DOWNLOAD_DATABASE = {
  // Example of how you add custom links for a specific TMDB movie ID:
  // "12345": {
  //   "360p": { host: "WetaFiles", url: "https://wetafiles.com/file-id-360p" },
  //   "720p": { host: "LoadedFile", url: "https://loadedfile.com/file-id-720p" }
  // }
};

export function getMovieDownloadLinks(movie) {
  const customLinks = MOVIE_DOWNLOAD_DATABASE[movie.id];

  // If you manually added custom links for this movie, return them
  if (customLinks) {
    return [
      customLinks["360p"] && { quality: "360p (Low Data)", host: customLinks["360p"].host, color: "#3b82f6", url: customLinks["360p"].url },
      customLinks["480p"] && { quality: "480p (Standard)", host: customLinks["480p"].host, color: "#22c55e", url: customLinks["480p"].url },
      customLinks["720p"] && { quality: "720p (HD)", host: customLinks["720p"].host, color: "#e50914", url: customLinks["720p"].url },
      customLinks["1080p"] && { quality: "1080p (Full HD)", host: customLinks["1080p"].host, color: "#a855f7", url: customLinks["1080p"].url },
    ].filter(Boolean);
  }

  // Fallback for movies without manual links yet: 
  // Point to the host homepages safely with target="_blank" so it never resets your app auth state
  return [
    {
      quality: "360p / 480p / 720p Available",
      host: "WetaFiles Hub",
      color: "#e50914",
      url: "https://wetafiles.com"
    },
    {
      quality: "Full HD Options",
      host: "LoadedFile Hub",
      color: "#22c55e",
      url: "https://loadedfile.com"
    }
  ];
}