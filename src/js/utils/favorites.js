const STORAGE_KEY = "tmdb_favorites";

/**
 * Récupère les favoris depuis le localStorage
 */
export function getFavorites() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Sauvegarde les favoris
 */
function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

/**
 * Vérifie si un film est déjà en favori
 */
export function isFavorite(movieId) {
  const favorites = getFavorites();
  return favorites.some(movie => movie.id === movieId);
}

/**
 * Ajoute un film en favori
 */
export function addFavorite(movie) {
  const favorites = getFavorites();

  if (isFavorite(movie.id)) return; // évite doublon

  const movieData = {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average
  };

  favorites.push(movieData);
  saveFavorites(favorites);
}

/**
 * Supprime un film des favoris
 */
export function removeFavorite(movieId) {
  let favorites = getFavorites();
  favorites = favorites.filter(movie => movie.id !== movieId);
  saveFavorites(favorites);
}
