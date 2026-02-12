// Point d'entrée principal de l'application

import { initRouter } from './router.js';
import { fetchPopularMovies, fetchMovieGenres } from './api/tmdb.js';
import { scoreMovies } from './utils/scoring.js';

async function preloadData() {
  try {
    const [movies, genres] = await Promise.all([
      fetchPopularMovies(),
      fetchMovieGenres(),
    ]);
    if (Array.isArray(movies) && movies.length) {
      const scored = scoreMovies(movies);
      window.allMovies = scored;
      window.allGenres = genres || [];
      if (window.updateHomeStats) window.updateHomeStats(window.allMovies);
      console.log('Preloaded movies:', window.allMovies.length);
    }
  } catch (err) {
    console.warn('Préchargement des films échoué:', err);
    window.allMovies = window.allMovies || [];
    window.allGenres = window.allGenres || [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await preloadData();
  initRouter();
});

