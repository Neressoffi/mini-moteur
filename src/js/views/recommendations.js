import { fetchPopularMovies, fetchSimilarMovies } from "../api/tmdb.js";
import { scoreMovies, formatScore } from "../utils/scoring.js";
import { addFavorite, removeFavorite, isFavorite } from "../utils/favorites.js";
export function renderRecommendationsView(root, params = {}) {
  const container = document.createElement("section");
  container.className = "view view-recommendations";
  container.innerHTML = `
    <h2>Recommandations de films</h2>
    <p>
      Dans un premier temps, nous affichons les films populaires issus de TMDB.
      Ensuite, nous ajouterons une logique de scoring pour les classer.
    </p>
    <div id="movies-list" class="movies-list"></div>
  `;

  root.appendChild(container);

  const listEl = container.querySelector("#movies-list");

  // état courant des films affichés (pour gérer favoris)
  let currentMovies = [];

  // gestion des clics sur la liste : favoris et navigation vers similar
  listEl.addEventListener("click", (e) => {
    const favBtn = e.target.closest(".fav-btn");
    if (favBtn) {
      const movieId = parseInt(favBtn.dataset.id, 10);
      if (isFavorite(movieId)) {
        removeFavorite(movieId);
        favBtn.classList.remove("active");
      } else {
        const movie = currentMovies.find((m) => m.id === movieId);
        if (movie) addFavorite(movie);
        favBtn.classList.add("active");
      }
      return;
    }

    const card = e.target.closest('.movie-card');
    if (card) {
      const id = parseInt(card.dataset.id, 10);
      if (!Number.isNaN(id)) {
        // naviguer vers la vue recommendations pour cet id (similar)
        window.location.hash = `#/recommandations/${id}`;
      }
    }
  });

  if (params && params.id) {
    // bouton retour
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.textContent = '← Retour';
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/recommandations';
    });
    container.querySelector('h2').after(backBtn);

    loadSimilarMovies(listEl, params.id);
  } else {
    loadPopularMovies(listEl);
  }

  async function loadPopularMovies(listEl) {
    listEl.innerHTML = "<p>Chargement des films populaires...</p>";

    try {
      const movies = await fetchPopularMovies();

      if (!movies.length) {
        listEl.innerHTML = "<p>Aucun film trouvé.</p>";
        return;
      }

      // calculer un score pour chaque film et trier
      const scored = scoreMovies(movies);
      currentMovies = scored;
      console.log("Films avec scores calculés :", scored);
      listEl.innerHTML = scored.map((movie) => createMovieCardHtml(movie)).join("");
    } catch (error) {
      console.error(error);
      listEl.innerHTML =
        "<p>Erreur lors du chargement des films. Vérifie ta connexion et ta clé TMDB.</p>";
    }
  }

  async function loadSimilarMovies(listEl, movieId) {
    listEl.innerHTML = `<p>Chargement des suggestions similaires pour le film ${movieId}...</p>`;

    try {
      const movies = await fetchSimilarMovies(movieId);

      if (!movies || !movies.length) {
        listEl.innerHTML = "<p>Aucune suggestion trouvée pour ce film.</p>";
        return;
      }

      const scored = scoreMovies(movies);
      currentMovies = scored;
      console.log(`Suggestions similaires pour ${movieId} :`, scored);
      listEl.innerHTML = scored.map((movie) => createMovieCardHtml(movie)).join("");
    } catch (error) {
      console.error(error);
      listEl.innerHTML =
        "<p>Erreur lors du chargement des suggestions. Vérifie ta connexion et ta clé TMDB.</p>";
    }
  }
}

function createMovieCardHtml(movie) {
  const favorite = isFavorite(movie.id);
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : "";

  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const score = movie._score !== undefined ? formatScore(movie._score) : null;

  return `
    <article class="movie-card" data-id="${movie.id}">
      ${
        posterUrl
          ? `<img class="movie-card__poster" src="${posterUrl}" alt="${movie.title}" loading="lazy" />`
          : '<div class="movie-card__poster"></div>'
      }
      <h3 class="movie-card__title">${movie.title}</h3>
      <div class="movie-card__meta">
        <span>${year}</span>
        <span>⭐ ${rating}</span>
        ${score !== null ? `<span class="movie-card__score">Score: ${score}</span>` : ""}
      <button class="fav-btn ${favorite ? "active" : ""}" data-id="${movie.id}">
        <svg viewBox="0 0 24 24" class="heart-icon">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
          2 6 4 4 6.5 4 
          8.04 4 9.54 4.81 10.4 6.09 
          11.26 4.81 12.76 4 14.3 4 
          16.8 4 18.8 6 18.8 8.5 
          18.8 12.28 15.4 15.36 10.25 20.03L12 21.35z"/>
        </svg>
      </button>
      </div>
    </article>
  `;
}
