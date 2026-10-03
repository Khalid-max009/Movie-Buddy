import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import "../css/Favourite.css";

function Favourites() {
  const { favorites } = useMovieContext();

  if (favorites && favorites.length > 0) {
    return (
      <div className="Favourites-page">
        <h2 className="page-title">Your Favourite Movies</h2>
        <div className="movies-grid">
          {favorites.map((movie) => (
            <MovieCard movie={movie} key={movie.id} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="Favourites-empty">
      <h2>No favourite movies yet</h2>
      <p>Start adding movies to your favorites list and they will show up here!</p>
    </div>
  );
}

export default Favourites;