import { fetchPopularMovies } from '../api/tmdb.js';

export function renderRecommendationsView(root) {
  const container = document.createElement('section');
  container.className = 'view view-recommendations';
  container.innerHTML = `
    <h2>Recommandations de films</h2>
    <p>
      Dans un premier temps, nous affichons les films populaires issus de TMDB.
      Ensuite, nous ajouterons une logique de scoring pour les classer.
    </p>
    <div id="movies-list" class="movies-list"></div>
  `;

  root.appendChild(container);

  const listEl = container.querySelector('#movies-list');
  loadPopularMovies(listEl);
}

async function loadPopularMovies(listEl) {
  listEl.innerHTML = '<p>Chargement des films populaires...</p>';

  try {
    const movies = await fetchPopularMovies();

    if (!movies.length) {
      listEl.innerHTML = '<p>Aucun film trouvé.</p>';
      return;
    }

    listEl.innerHTML = movies
      .map((movie) => createMovieCardHtml(movie))
      .join('');
  } catch (error) {
    console.error(error);
    listEl.innerHTML =
      '<p>Erreur lors du chargement des films. Vérifie ta connexion et ta clé TMDB.</p>';
  }
}

function createMovieCardHtml(movie) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : '';

  const year = movie.release_date ? movie.release_date.slice(0, 4) : 'N/A';
  const rating = movie.vote_average
    ? movie.vote_average.toFixed(1)
    : '—';

  return `
    <article class="movie-card">
      ${
        posterUrl
          ? `<img class="movie-card__poster" src="${posterUrl}" alt="${movie.title}" loading="lazy" />`
          : '<div class="movie-card__poster"></div>'
      }
      <h3 class="movie-card__title">${movie.title}</h3>
      <div class="movie-card__meta">
        <span>${year}</span>
        <span>⭐ ${rating}</span>
      </div>
    </article>
  `;
}


