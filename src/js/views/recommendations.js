import {
  fetchPopularMovies,
  fetchMovieGenres,
  fetchMovieDetails,
} from '../api/tmdb.js';

let allMovies = [];
let allGenres = [];

const defaultFilters = {
  genreId: 'all',
  minYear: '',
  minRating: 0,
  language: 'all',
};

let currentFilters = { ...defaultFilters };
let selectedMoviesForComparison = []; // Max 2 films

export function renderRecommendationsView(root) {
  const container = document.createElement('section');
  container.className = 'view view-recommendations';
  container.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Recommandations de films</h2>
        <p>
          Affinez les films populaires de TMDB grâce à un filtrage multi-critères
          fluide (genre, année, note, langue) sans rechargement de la page.
        </p>
      </div>
      <div class="header-actions">
        <button id="surprise-me-btn" class="surprise-me-btn" title="Trouve-moi un film qui correspond à tes critères !">
          🎲 Surprise Me
        </button>
        <div class="badge badge-soft" id="movies-count-badge">
          Chargement...
        </div>
      </div>
    </div>

    <section class="filters">
      <div class="filters__group">
        <label class="filters__label" for="filter-genre">Genre</label>
        <select id="filter-genre" class="filters__control">
          <option value="all">Tous les genres</option>
        </select>
      </div>

      <div class="filters__group">
        <label class="filters__label" for="filter-year">Année min.</label>
        <input
          id="filter-year"
          class="filters__control"
          type="number"
          min="1900"
          max="2100"
          placeholder="Ex: 2015"
        />
      </div>

      <div class="filters__group">
        <label class="filters__label" for="filter-rating">
          Note min. <span id="filter-rating-value" class="filters__hint">(0.0)</span>
        </label>
        <input
          id="filter-rating"
          class="filters__control"
          type="range"
          min="0"
          max="10"
          step="0.5"
          value="0"
        />
      </div>

      <div class="filters__group">
        <label class="filters__label" for="filter-language">Langue</label>
        <select id="filter-language" class="filters__control">
          <option value="all">Toutes les langues</option>
        </select>
      </div>

      <button id="filters-reset" class="filters__reset">
        Réinitialiser
      </button>
      <button id="surprise-me-btn" class="filters__surprise">
        🎲 Surprise Me
      </button>
    </section>

    <div class="weights-section">
      <h3>Pondération des critères</h3>
      <div class="weights__group">
        <label for="weight-popularity">Popularité <span id="weight-popularity-value" class="filters__hint">(1)</span></label>
        <input id="weight-popularity" class="weights__slider" type="range" min="0" max="2" step="0.01" value="1" />
      </div>
      <div class="weights__group">
        <label for="weight-rating">Note <span id="weight-rating-value" class="filters__hint">(1)</span></label>
        <input id="weight-rating" class="weights__slider" type="range" min="0" max="2" step="0.01" value="1" />
      </div>
      <div class="weights__group">
        <label for="weight-recency">Récence <span id="weight-recency-value" class="filters__hint">(1)</span></label>
        <input id="weight-recency" class="weights__slider" type="range" min="0" max="2" step="0.01" value="1" />
      </div>
    </div>

    <div id="dashboard-section" class="dashboard-section">
      <h3 class="dashboard-title">📊 Statistiques des films affichés</h3>
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="dashboard-card__icon">⭐</div>
          <div class="dashboard-card__content">
            <div class="dashboard-card__label">Moyenne des notes</div>
            <div class="dashboard-card__value" id="stats-average-rating">—</div>
          </div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__icon">🔥</div>
          <div class="dashboard-card__content">
            <div class="dashboard-card__label">Film le plus populaire</div>
            <div class="dashboard-card__value" id="stats-most-popular">—</div>
          </div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__icon">🆕</div>
          <div class="dashboard-card__content">
            <div class="dashboard-card__label">Film le plus récent</div>
            <div class="dashboard-card__value" id="stats-most-recent">—</div>
          </div>
        </div>
      </div>
      <div class="dashboard-chart">
        <h4 class="dashboard-chart__title">Répartition par genre</h4>
        <div id="stats-genre-chart" class="genre-chart"></div>
      </div>
    </div>

    <div id="comparator-section" class="comparator-section" style="display: none;">
      <div class="comparator-header">
        <h3>Comparateur de films</h3>
        <button id="comparator-clear" class="comparator-clear">Effacer la sélection</button>
      </div>
      <div id="comparator-table" class="comparator-table"></div>
    </div>

    <div id="movies-list" class="movies-list"></div>
  `;

  root.appendChild(container);

  const listEl = container.querySelector('#movies-list');
  const genreSelect = container.querySelector('#filter-genre');
  const yearInput = container.querySelector('#filter-year');
  const ratingRange = container.querySelector('#filter-rating');
  const ratingValue = container.querySelector('#filter-rating-value');
  const languageSelect = container.querySelector('#filter-language');
  const resetButton = container.querySelector('#filters-reset');
  const countBadge = container.querySelector('#movies-count-badge');

  // Sliders de pondération
  const weightPopularity = container.querySelector('#weight-popularity');
  const weightRating = container.querySelector('#weight-rating');
  const weightRecency = container.querySelector('#weight-recency');
  const weightPopularityValue = container.querySelector('#weight-popularity-value');
  const weightRatingValue = container.querySelector('#weight-rating-value');
  const weightRecencyValue = container.querySelector('#weight-recency-value');

  const comparatorSection = container.querySelector('#comparator-section');
  const comparatorTable = container.querySelector('#comparator-table');
  const comparatorClear = container.querySelector('#comparator-clear');

  if (comparatorClear) {
    comparatorClear.addEventListener('click', () => {
      selectedMoviesForComparison = [];
      updateComparator(comparatorSection, comparatorTable);
      renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
    });
  }

  window.recommendationWeights = {
    popularity: 1,
    rating: 1,
    recency: 1,
  };

  function updateWeight(type, value) {
    window.recommendationWeights[type] = Number(value);
    if (type === 'popularity') weightPopularityValue.textContent = `(${value})`;
    if (type === 'rating') weightRatingValue.textContent = `(${value})`;
    if (type === 'recency') weightRecencyValue.textContent = `(${value})`;
    renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
  }

  weightPopularity.addEventListener('input', (e) => {
    updateWeight('popularity', e.target.value);
  });
  weightRating.addEventListener('input', (e) => {
    updateWeight('rating', e.target.value);
  });
  weightRecency.addEventListener('input', (e) => {
    updateWeight('recency', e.target.value);
  });

  // Bouton "Surprise Me"
  const surpriseMeBtn = container.querySelector('#surprise-me-btn');
  if (surpriseMeBtn) {
    surpriseMeBtn.addEventListener('click', () => {
      surpriseMe(listEl, countBadge, comparatorSection, comparatorTable);
    });
  }

  attachFilterListeners({
    listEl,
    genreSelect,
    yearInput,
    ratingRange,
    ratingValue,
    languageSelect,
    resetButton,
    countBadge,
    comparatorSection,
    comparatorTable,
  });

  loadInitialData({
    listEl,
    genreSelect,
    languageSelect,
    countBadge,
    comparatorSection,
    comparatorTable,
  });
}

function attachFilterListeners({
  listEl,
  genreSelect,
  yearInput,
  ratingRange,
  ratingValue,
  languageSelect,
  resetButton,
  countBadge,
  comparatorSection,
  comparatorTable,
}) {
  genreSelect.addEventListener('change', () => {
    currentFilters.genreId = genreSelect.value;
    renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
  });

  yearInput.addEventListener('input', () => {
    currentFilters.minYear = yearInput.value.trim();
    renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
  });

  ratingRange.addEventListener('input', () => {
    currentFilters.minRating = Number(ratingRange.value);
    ratingValue.textContent = `(${ratingRange.value})`;
    renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
  });

  languageSelect.addEventListener('change', () => {
    currentFilters.language = languageSelect.value;
    renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
  });

  resetButton.addEventListener('click', () => {
    currentFilters = { ...defaultFilters };

    genreSelect.value = 'all';
    yearInput.value = '';
    ratingRange.value = '0';
    ratingValue.textContent = '(0.0)';
    languageSelect.value = 'all';

    renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
  });
}

async function loadInitialData({
  listEl,
  genreSelect,
  languageSelect,
  countBadge,
  comparatorSection,
  comparatorTable,
}) {
  listEl.innerHTML = '<p>Chargement des films populaires...</p>';

  try {
    const [movies, genres] = await Promise.all([
      fetchPopularMovies(),
      fetchMovieGenres(),
    ]);

    allMovies = movies ?? [];
    allGenres = genres ?? [];

    if (!allMovies.length) {
      listEl.innerHTML = '<p>Aucun film trouvé.</p>';
      countBadge.textContent = '0 film';
      return;
    }

    hydrateGenreSelect(genreSelect);
    hydrateLanguageSelect(languageSelect);

    renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
  } catch (error) {
    console.error(error);
    listEl.innerHTML =
      '<p>Erreur lors du chargement des films. Vérifie ta connexion et ta clé TMDB.</p>';
    countBadge.textContent = 'Erreur';
  }
}

function hydrateGenreSelect(selectEl) {
  selectEl.innerHTML =
    '<option value="all">Tous les genres</option>' +
    allGenres
      .map(
        (genre) =>
          `<option value="${genre.id}">${genre.name}</option>`,
      )
      .join('');
}

function hydrateLanguageSelect(selectEl) {
  const uniqueLanguages = Array.from(
    new Set(allMovies.map((m) => m.original_language).filter(Boolean)),
  ).sort();

  selectEl.innerHTML =
    '<option value="all">Toutes les langues</option>' +
    uniqueLanguages
      .map(
        (code) =>
          `<option value="${code}">${code.toUpperCase()}</option>`,
      )
      .join('');
}

function renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable) {
  if (!allMovies.length) {
    listEl.innerHTML = '<p>Aucun film à afficher.</p>';
    countBadge.textContent = '0 film';
    updateComparator(comparatorSection, comparatorTable);
    return;
  }

  const nowYear = new Date().getFullYear();
  const popStats = getMinMax(allMovies, 'popularity');
  const ratingStats = getMinMax(allMovies, 'vote_average');
  const yearStats = getMinMax(
    allMovies.filter(m => m.release_date),
    'release_date'
  );

  // Filtrage
  const filtered = allMovies.filter((movie) => {
    const year = movie.release_date
      ? Number(movie.release_date.slice(0, 4))
      : null;

    // Genre
    if (
      currentFilters.genreId !== 'all' &&
      !movie.genre_ids.includes(Number(currentFilters.genreId))
    ) {
      return false;
    }

    // Année min
    if (currentFilters.minYear) {
      const minYear = Number(currentFilters.minYear);
      if (!year || year < minYear) {
        return false;
      }
    }

    // Note min
    if (currentFilters.minRating > 0) {
      const rating = movie.vote_average ?? 0;
      if (rating < currentFilters.minRating) {
        return false;
      }
    }

    // Langue
    if (
      currentFilters.language !== 'all' &&
      movie.original_language !== currentFilters.language
    ) {
      return false;
    }

    return true;
  });

  if (!filtered.length) {
    listEl.innerHTML =
      '<p>Aucun film ne correspond aux critères sélectionnés. Essaie d’élargir les filtres.</p>';
    countBadge.textContent = '0 film';
    return;
  }

  // Calcul du score pondéré
  function computeScore(movie) {
    const weights = window.recommendationWeights || { popularity: 1, rating: 1, recency: 1 };
    // Popularité normalisée
    let popNorm = 0;
    if (typeof movie.popularity === 'number' && popStats.max > popStats.min) {
      popNorm = (movie.popularity - popStats.min) / (popStats.max - popStats.min);
    }
    // Note normalisée
    let ratingNorm = 0;
    if (typeof movie.vote_average === 'number' && ratingStats.max > ratingStats.min) {
      ratingNorm = (movie.vote_average - ratingStats.min) / (ratingStats.max - ratingStats.min);
    }
    // Récence normalisée (plus récent = score plus haut)
    let recencyNorm = 0;
    if (movie.release_date) {
      const year = Number(movie.release_date.slice(0, 4));
      if (!isNaN(year) && yearStats.max > yearStats.min) {
        recencyNorm = (year - yearStats.min) / (yearStats.max - yearStats.min);
      }
    }
    return (
      popNorm * weights.popularity +
      ratingNorm * weights.rating +
      recencyNorm * weights.recency
    );
  }

  const sorted = filtered.slice().sort((a, b) => computeScore(b) - computeScore(a));

  listEl.innerHTML = sorted
    .map((movie) => createMovieCardHtml(movie))
    .join('');

  // Attacher les event listeners pour les boutons de comparaison
  if (comparatorSection && comparatorTable) {
    attachComparisonButtons(listEl, comparatorSection, comparatorTable);
    updateComparator(comparatorSection, comparatorTable);
  }

  // Attacher les event listeners pour ouvrir les détails du film
  attachMovieCardClickListeners(listEl);

  const suffix = sorted.length > 1 ? 'films' : 'film';
  countBadge.textContent = `${sorted.length} ${suffix}`;

  // Mettre à jour le dashboard de statistiques
  updateDashboard(sorted);
}

function surpriseMe(listEl, countBadge, comparatorSection, comparatorTable) {
  if (!allMovies.length) {
    alert('Aucun film disponible pour la surprise !');
    return;
  }

  // Récupérer les films filtrés (même logique que renderFilteredMovies)
  const nowYear = new Date().getFullYear();
  const popStats = getMinMax(allMovies, 'popularity');
  const ratingStats = getMinMax(allMovies, 'vote_average');
  const yearStats = getMinMax(
    allMovies.filter((m) => m.release_date),
    'release_date',
  );

  // Filtrage
  const filtered = allMovies.filter((movie) => {
    const year = movie.release_date
      ? Number(movie.release_date.slice(0, 4))
      : null;

    // Genre
    if (
      currentFilters.genreId !== 'all' &&
      !movie.genre_ids.includes(Number(currentFilters.genreId))
    ) {
      return false;
    }

    // Année min
    if (currentFilters.minYear) {
      const minYear = Number(currentFilters.minYear);
      if (!year || year < minYear) {
        return false;
      }
    }

    // Note min
    if (currentFilters.minRating > 0) {
      const rating = movie.vote_average ?? 0;
      if (rating < currentFilters.minRating) {
        return false;
      }
    }

    // Langue
    if (
      currentFilters.language !== 'all' &&
      movie.original_language !== currentFilters.language
    ) {
      return false;
    }

    return true;
  });

  if (!filtered.length) {
    alert(
      'Aucun film ne correspond à tes critères. Essaie d\'élargir les filtres !',
    );
    return;
  }

  // Calcul du score pondéré (même logique que renderFilteredMovies)
  function computeScore(movie) {
    const weights =
      window.recommendationWeights || { popularity: 1, rating: 1, recency: 1 };
    // Popularité normalisée
    let popNorm = 0;
    if (
      typeof movie.popularity === 'number' &&
      popStats.max > popStats.min
    ) {
      popNorm =
        (movie.popularity - popStats.min) / (popStats.max - popStats.min);
    }
    // Note normalisée
    let ratingNorm = 0;
    if (
      typeof movie.vote_average === 'number' &&
      ratingStats.max > ratingStats.min
    ) {
      ratingNorm =
        (movie.vote_average - ratingStats.min) /
        (ratingStats.max - ratingStats.min);
    }
    // Récence normalisée (plus récent = score plus haut)
    let recencyNorm = 0;
    if (movie.release_date) {
      const year = Number(movie.release_date.slice(0, 4));
      if (!isNaN(year) && yearStats.max > yearStats.min) {
        recencyNorm =
          (year - yearStats.min) / (yearStats.max - yearStats.min);
      }
    }
    return (
      popNorm * weights.popularity +
      ratingNorm * weights.rating +
      recencyNorm * weights.recency
    );
  }

  // Calculer les scores pour tous les films filtrés
  const moviesWithScores = filtered.map((movie) => ({
    movie,
    score: computeScore(movie),
  }));

  // Trier par score décroissant
  moviesWithScores.sort((a, b) => b.score - a.score);

  // Sélection intelligente : prendre parmi les meilleurs (top 30% ou au moins top 5)
  const topCount = Math.max(
    5,
    Math.ceil(moviesWithScores.length * 0.3),
  );
  const topMovies = moviesWithScores.slice(0, topCount);

  // Sélectionner aléatoirement parmi les meilleurs
  const randomIndex = Math.floor(Math.random() * topMovies.length);
  const selectedMovie = topMovies[randomIndex].movie;

  // Re-rendre les films pour s'assurer qu'ils sont affichés
  renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);

  // Mettre en évidence le film sélectionné
  setTimeout(() => {
    const movieCard = listEl.querySelector(
      `[data-movie-id="${selectedMovie.id}"]`,
    );
    if (movieCard) {
      // Ajouter une classe pour l'animation
      movieCard.classList.add('surprise-selected');

      // Scroll jusqu'au film
      movieCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Retirer la classe après l'animation
      setTimeout(() => {
        movieCard.classList.remove('surprise-selected');
      }, 2000);
    }
  }, 100);
}

function updateDashboard(movies) {
  const avgRatingEl = document.getElementById('stats-average-rating');
  const mostPopularEl = document.getElementById('stats-most-popular');
  const mostRecentEl = document.getElementById('stats-most-recent');
  const genreChartEl = document.getElementById('stats-genre-chart');

  if (!avgRatingEl || !mostPopularEl || !mostRecentEl || !genreChartEl) {
    return; // Les éléments n'existent pas encore
  }

  if (!movies || movies.length === 0) {
    // Afficher des valeurs par défaut si aucun film
    avgRatingEl.textContent = '—';
    mostPopularEl.textContent = '—';
    mostRecentEl.textContent = '—';
    genreChartEl.innerHTML = '<p class="no-data">Aucune donnée disponible</p>';
    return;
  }

  // 1. Moyenne des notes
  const ratings = movies
    .map((m) => m.vote_average)
    .filter((r) => typeof r === 'number' && r > 0);
  const averageRating =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
      : '—';
  avgRatingEl.textContent =
    averageRating !== '—' ? `${averageRating} / 10` : '—';

  // 2. Film le plus populaire
  const mostPopular = movies.reduce((max, movie) => {
    const pop = movie.popularity ?? 0;
    return pop > (max.popularity ?? 0) ? movie : max;
  }, movies[0]);
  mostPopularEl.textContent = mostPopular.title || '—';

  // 3. Film le plus récent
  const mostRecent = movies.reduce((latest, movie) => {
    if (!movie.release_date) return latest;
    if (!latest.release_date) return movie;
    const movieYear = Number(movie.release_date.slice(0, 4));
    const latestYear = Number(latest.release_date.slice(0, 4));
    return movieYear > latestYear ? movie : latest;
  }, movies[0]);
  mostRecentEl.textContent = mostRecent.release_date
    ? `${mostRecent.title} (${mostRecent.release_date.slice(0, 4)})`
    : '—';

  // 4. Répartition par genre
  updateGenreChart(movies);
}

function updateGenreChart(movies) {
  const chartEl = document.getElementById('stats-genre-chart');
  if (!chartEl) return;

  // Compter les occurrences de chaque genre
  const genreCounts = {};
  movies.forEach((movie) => {
    if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
      movie.genre_ids.forEach((genreId) => {
        const genre = allGenres.find((g) => g.id === genreId);
        if (genre) {
          genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
        }
      });
    }
  });

  if (Object.keys(genreCounts).length === 0) {
    chartEl.innerHTML = '<p class="no-data">Aucun genre trouvé</p>';
    return;
  }

  // Trier par nombre décroissant et prendre les top 8
  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxCount = Math.max(...sortedGenres.map(([, count]) => count));

  // Générer le graphique en barres
  chartEl.innerHTML = sortedGenres
    .map(([genreName, count]) => {
      const percentage = (count / maxCount) * 100;
      return `
        <div class="genre-chart__item">
          <div class="genre-chart__label">${genreName}</div>
          <div class="genre-chart__bar-container">
            <div 
              class="genre-chart__bar" 
              style="width: ${percentage}%"
              title="${count} film${count > 1 ? 's' : ''}"
            >
              <span class="genre-chart__value">${count}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function attachComparisonButtons(listEl, comparatorSection, comparatorTable) {
  const buttons = listEl.querySelectorAll('.movie-card__compare-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const movieId = Number(btn.dataset.movieId || e.currentTarget.dataset.movieId);
      if (!movieId || isNaN(movieId)) {
        console.error('Movie ID not found', btn);
        return;
      }
      toggleMovieForComparison(movieId, listEl, comparatorSection, comparatorTable);
    });
  });
}

function toggleMovieForComparison(movieId, listEl, comparatorSection, comparatorTable) {
  const movie = allMovies.find((m) => m.id === movieId);
  if (!movie) {
    console.error('Movie not found:', movieId);
    return;
  }

  const index = selectedMoviesForComparison.findIndex((m) => m.id === movieId);

  if (index >= 0) {
    // Désélectionner
    selectedMoviesForComparison.splice(index, 1);
  } else {
    // Sélectionner (max 2)
    if (selectedMoviesForComparison.length >= 2) {
      selectedMoviesForComparison.shift(); // Retirer le premier
    }
    selectedMoviesForComparison.push(movie);
  }

  // Re-rendre les cartes pour mettre à jour les boutons
  const countBadge = document.querySelector('#movies-count-badge');
  if (listEl && countBadge) {
    renderFilteredMovies(listEl, countBadge, comparatorSection, comparatorTable);
  }
}

function attachMovieCardClickListeners(listEl) {
  const clickableCards = listEl.querySelectorAll('.movie-card__clickable');
  clickableCards.forEach((card) => {
    card.addEventListener('click', async (e) => {
      e.stopPropagation();
      const movieId = Number(card.dataset.movieId);
      if (!movieId || isNaN(movieId)) {
        console.error('Movie ID not found', card);
        return;
      }
      await showMovieDetails(movieId);
    });
  });
}

async function showMovieDetails(movieId) {
  // Afficher un loader
  const modal = createModal();
  modal.innerHTML = `
    <div class="movie-modal__content">
      <button class="movie-modal__close">&times;</button>
      <div class="movie-modal__loader">Chargement des détails...</div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  // Fermer la modal
  modal.querySelector('.movie-modal__close').addEventListener('click', () => {
    modal.remove();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  try {
    const details = await fetchMovieDetails(movieId);
    renderMovieDetails(modal, details);
  } catch (error) {
    console.error('Erreur lors du chargement des détails:', error);
    modal.querySelector('.movie-modal__content').innerHTML = `
      <button class="movie-modal__close">&times;</button>
      <div class="movie-modal__error">
        Erreur lors du chargement des détails du film.
      </div>
    `;
    modal.querySelector('.movie-modal__close').addEventListener('click', () => {
      modal.remove();
    });
  }
}

function createModal() {
  const existingModal = document.querySelector('.movie-modal');
  if (existingModal) {
    existingModal.remove();
  }
  const modal = document.createElement('div');
  modal.className = 'movie-modal';
  return modal;
}

function renderMovieDetails(modal, details) {
  const posterUrl = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : '';
  const backdropUrl = details.backdrop_path
    ? `https://image.tmdb.org/t/w1280${details.backdrop_path}`
    : '';

  const genres = details.genres
    ? details.genres.map((g) => g.name).join(', ')
    : 'Non spécifié';

  const directors =
    details.credits && details.credits.crew
      ? details.credits.crew
          .filter((p) => p.job === 'Director')
          .map((p) => p.name)
          .join(', ')
      : 'Non spécifié';

  const cast =
    details.credits && details.credits.cast
      ? details.credits.cast.slice(0, 5).map((a) => a.name).join(', ')
      : 'Non spécifié';

  const runtime = details.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}min`
    : 'Non spécifié';

  const releaseDate = details.release_date
    ? new Date(details.release_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Non spécifié';

  const budget = details.budget && details.budget > 0
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(details.budget)
    : 'Non spécifié';

  const revenue = details.revenue && details.revenue > 0
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(details.revenue)
    : 'Non spécifié';

  // Trouver le trailer (YouTube)
  const trailer = details.videos && details.videos.results
    ? details.videos.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube',
      )
    : null;

  modal.innerHTML = `
    <div class="movie-modal__content">
      <button class="movie-modal__close">&times;</button>
      <div class="movie-modal__header" style="background-image: url('${backdropUrl}')">
        <div class="movie-modal__header-overlay"></div>
        <div class="movie-modal__header-content">
          ${posterUrl ? `<img class="movie-modal__poster" src="${posterUrl}" alt="${details.title}" />` : ''}
          <div class="movie-modal__header-info">
            <h2 class="movie-modal__title">${details.title}</h2>
            ${details.tagline ? `<p class="movie-modal__tagline">${details.tagline}</p>` : ''}
            <div class="movie-modal__quick-info">
              <span>⭐ ${details.vote_average ? details.vote_average.toFixed(1) : '—'} / 10</span>
              <span>📅 ${releaseDate}</span>
              <span>⏱️ ${runtime}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="movie-modal__body">
        ${trailer ? `
        <div class="movie-modal__section">
          <h3>🎬 Bande-annonce</h3>
          <div class="movie-modal__trailer">
            <iframe
              class="movie-modal__video"
              src="https://www.youtube.com/embed/${trailer.key}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        </div>
        ` : ''}
        <div class="movie-modal__section">
          <h3>Synopsis</h3>
          <p>${details.overview || 'Aucun synopsis disponible.'}</p>
        </div>
        <div class="movie-modal__section">
          <h3>Informations</h3>
          <div class="movie-modal__info-grid">
            <div class="movie-modal__info-item">
              <strong>Genres:</strong> ${genres}
            </div>
            <div class="movie-modal__info-item">
              <strong>Réalisateur(s):</strong> ${directors}
            </div>
            <div class="movie-modal__info-item">
              <strong>Casting principal:</strong> ${cast}
            </div>
            <div class="movie-modal__info-item">
              <strong>Budget:</strong> ${budget}
            </div>
            <div class="movie-modal__info-item">
              <strong>Recettes:</strong> ${revenue}
            </div>
            <div class="movie-modal__info-item">
              <strong>Note moyenne:</strong> ${details.vote_average ? details.vote_average.toFixed(1) : '—'} / 10 (${details.vote_count || 0} votes)
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Réattacher les event listeners
  modal.querySelector('.movie-modal__close').addEventListener('click', () => {
    modal.remove();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Fermer avec Échap
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

function updateComparator(comparatorSection, comparatorTable) {
  if (!comparatorSection || !comparatorTable) return;

  if (selectedMoviesForComparison.length === 2) {
    comparatorSection.style.display = 'block';
    comparatorTable.innerHTML = renderComparisonTable(
      selectedMoviesForComparison[0],
      selectedMoviesForComparison[1],
    );
  } else {
    comparatorSection.style.display = 'none';
    comparatorTable.innerHTML = '';
  }
}

function renderComparisonTable(movie1, movie2) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dateStr.slice(0, 4);
  };

  const formatPopularity = (pop) => {
    if (typeof pop !== 'number') return 'N/A';
    return pop.toFixed(2);
  };

  const formatRating = (rating) => {
    if (typeof rating !== 'number') return 'N/A';
    return rating.toFixed(1);
  };

  const formatVoteCount = (count) => {
    if (typeof count !== 'number') return 'N/A';
    return count.toLocaleString('fr-FR');
  };

  const poster1 = movie1.poster_path
    ? `https://image.tmdb.org/t/p/w154${movie1.poster_path}`
    : '';
  const poster2 = movie2.poster_path
    ? `https://image.tmdb.org/t/p/w154${movie2.poster_path}`
    : '';

  return `
    <table class="comparison-table">
      <thead>
        <tr>
          <th></th>
          <th>
            <div class="comparison-movie-header">
              ${poster1 ? `<img src="${poster1}" alt="${movie1.title}" />` : ''}
              <span>${movie1.title}</span>
            </div>
          </th>
          <th>
            <div class="comparison-movie-header">
              ${poster2 ? `<img src="${poster2}" alt="${movie2.title}" />` : ''}
              <span>${movie2.title}</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="comparison-label">Note</td>
          <td class="comparison-value ${movie1.vote_average > movie2.vote_average ? 'winner' : ''}">
            ⭐ ${formatRating(movie1.vote_average)}
          </td>
          <td class="comparison-value ${movie2.vote_average > movie1.vote_average ? 'winner' : ''}">
            ⭐ ${formatRating(movie2.vote_average)}
          </td>
        </tr>
        <tr>
          <td class="comparison-label">Popularité</td>
          <td class="comparison-value ${movie1.popularity > movie2.popularity ? 'winner' : ''}">
            ${formatPopularity(movie1.popularity)}
          </td>
          <td class="comparison-value ${movie2.popularity > movie1.popularity ? 'winner' : ''}">
            ${formatPopularity(movie2.popularity)}
          </td>
        </tr>
        <tr>
          <td class="comparison-label">Date de sortie</td>
          <td class="comparison-value">
            ${formatDate(movie1.release_date)}
          </td>
          <td class="comparison-value">
            ${formatDate(movie2.release_date)}
          </td>
        </tr>
        <tr>
          <td class="comparison-label">Nombre de votes</td>
          <td class="comparison-value ${movie1.vote_count > movie2.vote_count ? 'winner' : ''}">
            ${formatVoteCount(movie1.vote_count)}
          </td>
          <td class="comparison-value ${movie2.vote_count > movie1.vote_count ? 'winner' : ''}">
            ${formatVoteCount(movie2.vote_count)}
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

function getMinMax(arr, key) {
  let min = Infinity,
    max = -Infinity;
  for (const m of arr) {
    if (key === 'release_date' && m[key]) {
      const year = Number(m[key].slice(0, 4));
      if (!isNaN(year)) {
        if (year < min) min = year;
        if (year > max) max = year;
      }
    } else if (typeof m[key] === 'number') {
      if (m[key] < min) min = m[key];
      if (m[key] > max) max = m[key];
    }
  }
  return { min, max };
}

function analyzeRecommendationReasons(movie, allMovies) {
  const reasons = [];
  const weights = window.recommendationWeights || {
    popularity: 1,
    rating: 1,
    recency: 1,
  };

  // Calcul des valeurs normalisées pour comparaison
  const popStats = getMinMax(allMovies, 'popularity');
  const ratingStats = getMinMax(allMovies, 'vote_average');
  const yearStats = getMinMax(
    allMovies.filter((m) => m.release_date),
    'release_date',
  );

  const nowYear = new Date().getFullYear();

  // 1. Note élevée
  if (movie.vote_average >= 7.5) {
    reasons.push({
      text: 'Note élevée',
      strength: movie.vote_average / 10,
      weight: weights.rating,
    });
  } else if (movie.vote_average >= 6.5) {
    reasons.push({
      text: 'Bonne note',
      strength: movie.vote_average / 10,
      weight: weights.rating,
    });
  }

  // 2. Film récent
  if (movie.release_date) {
    const year = Number(movie.release_date.slice(0, 4));
    const yearsAgo = nowYear - year;
    if (yearsAgo <= 2) {
      reasons.push({
        text: 'Film très récent',
        strength: 1 - yearsAgo / 5,
        weight: weights.recency,
      });
    } else if (yearsAgo <= 5) {
      reasons.push({
        text: 'Film récent',
        strength: 1 - yearsAgo / 10,
        weight: weights.recency,
      });
    }
  }

  // 3. Correspond à vos genres favoris (si un filtre genre est actif)
  if (
    currentFilters.genreId !== 'all' &&
    movie.genre_ids.includes(Number(currentFilters.genreId))
  ) {
    const genreName =
      allGenres.find((g) => g.id === Number(currentFilters.genreId))?.name ||
      '';
    reasons.push({
      text: `Correspond à vos genres favoris`,
      strength: 1,
      weight: 1.5, // Bonus pour correspondance avec filtre utilisateur
    });
  }

  // 4. Popularité élevée
  if (movie.popularity) {
    const popNorm =
      popStats.max > popStats.min
        ? (movie.popularity - popStats.min) / (popStats.max - popStats.min)
        : 0;
    if (popNorm >= 0.7) {
      reasons.push({
        text: 'Très populaire',
        strength: popNorm,
        weight: weights.popularity,
      });
    } else if (popNorm >= 0.5) {
      reasons.push({
        text: 'Populaire',
        strength: popNorm,
        weight: weights.popularity,
      });
    }
  }

  // 5. Nombre de votes élevé (fiabilité)
  if (movie.vote_count >= 1000) {
    reasons.push({
      text: 'Bien noté par de nombreux spectateurs',
      strength: Math.min(movie.vote_count / 5000, 1),
      weight: 0.8,
    });
  }

  // Trier par contribution au score (strength * weight) et prendre les 3 meilleurs
  reasons.sort((a, b) => b.strength * b.weight - a.strength * a.weight);
  return reasons.slice(0, 3);
}

function generateExplanationText(reasons) {
  if (reasons.length === 0) {
    return 'Recommandé pour sa diversité de critères.';
  }

  const reasonsText = reasons.map((r) => r.text).join('</li><li>');
  return `Recommandé car :<ul class="explanation-list"><li>${reasonsText}</li></ul>`;
}

function createMovieCardHtml(movie) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : '';

  const year = movie.release_date ? movie.release_date.slice(0, 4) : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';

  // Analyse des raisons de recommandation
  const reasons = analyzeRecommendationReasons(movie, allMovies);
  const explanation = generateExplanationText(reasons);

  const isSelected = selectedMoviesForComparison.some(
    (m) => m.id === movie.id,
  );
  const canSelect = selectedMoviesForComparison.length < 2;

  return `
    <article class="movie-card" data-movie-id="${movie.id}">
      <div class="movie-card__clickable" data-movie-id="${movie.id}" title="Cliquer pour voir les détails">
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
        <div class="movie-card__explanation">
          ${explanation}
        </div>
      </div>
      <button 
        class="movie-card__compare-btn ${isSelected ? 'selected' : ''}" 
        data-movie-id="${movie.id}"
        ${!canSelect && !isSelected ? 'disabled' : ''}
        title="${isSelected ? 'Retirer de la comparaison' : canSelect ? 'Ajouter à la comparaison' : 'Maximum 2 films pour comparer'}"
      >
        ${isSelected ? '✓ Sélectionné' : 'Comparer'}
      </button>
    </article>
  `;
}

