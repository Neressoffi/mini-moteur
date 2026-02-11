import { fetchPopularMovies } from "../api/tmdb.js";
import { scoreMovies, formatScore } from "../utils/scoring.js";
import { addFavorite, removeFavorite, isFavorite } from "../utils/favorites.js";

export function renderRecommendationsView(root) {
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
    console.log("Films avec scores calculés :", scored);
    listEl.innerHTML = scored
      .map((movie) => createMovieCardHtml(movie))
      .join("");

    document.addEventListener("click", (e) => {
      const button = e.target.closest(".fav-btn");
      if (!button) return;

      const movieId = parseInt(button.dataset.id);

      if (isFavorite(movieId)) {
        removeFavorite(movieId);
        button.classList.remove("active");
      } else {
        const movie = scored.find((m) => m.id === movieId);
        addFavorite(movie);
        button.classList.add("active");
      }
    });

  } catch (error) {
    console.error(error);
    listEl.innerHTML =
      "<p>Erreur lors du chargement des films. Vérifie ta connexion et ta clé TMDB.</p>";
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
