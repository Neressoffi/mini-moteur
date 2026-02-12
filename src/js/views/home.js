export function renderHomeView(root) {
  const container = document.createElement("section");
  container.className = "view view-home";
  container.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Bienvenue sur Mini Moteur 🎬</h2>
        <p>
          Découvrez des films populaires, filtrez selon vos goûts et laissez
          l'algorithme suggérer des pépites. Commencez en explorant les
          recommandations ou en testant le bouton « Surprise Me ».
        </p>
      </div>
      <div class="header-actions">
        <a href="#/recommandations" class="surprise-me-btn">Voir les recommandations</a>
        <a href="#/recommandations" id="home-surprise" class="surprise-me-btn">🎲 Surprise Me</a>
      </div>
    </div>

    <section class="home-quick">
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="dashboard-card__icon">🎞️</div>
          <div class="dashboard-card__content">
            <div class="dashboard-card__label">Films indexés</div>
            <div class="dashboard-card__value" id="home-total-films">—</div>
          </div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__icon">⭐</div>
          <div class="dashboard-card__content">
            <div class="dashboard-card__label">Meilleure note</div>
            <div class="dashboard-card__value" id="home-top-rated">—</div>
          </div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__icon">🆕</div>
          <div class="dashboard-card__content">
            <div class="dashboard-card__label">Dernier film</div>
            <div class="dashboard-card__value" id="home-most-recent">—</div>
          </div>
        </div>
      </div>
    </section>

    <section class="view-intro" style="margin-top:1rem;">
      <h3>Fonctionnalités</h3>
      <ul class="explanation-list">
        <li>Filtrage multi-critères (genre, année, note, langue)</li>
        <li>Pondération des critères pour personnaliser le scoring</li>
        <li>Comparateur de films et favoris</li>
      </ul>
    </section>
  `;

  root.appendChild(container);

  // Comportement: si l'utilisateur clique sur "Surprise Me" depuis l'accueil,
  // naviguer vers la vue recommandations et déclencher l'animation plus tard.
  const surprise = container.querySelector('#home-surprise');
  if (surprise) {
    surprise.addEventListener('click', (e) => {
      // la navigation hash se charge de montrer la vue; on peut garder un petit timeout
      setTimeout(() => {
        const evt = new CustomEvent('home:surprise');
        window.dispatchEvent(evt);
      }, 300);
    });
  }

  // Si les films sont déjà chargés ailleurs, demander la mise à jour des stats
  if (window.updateHomeStats) {
    try {
      window.updateHomeStats(window.allMovies || []);
    } catch (err) {
      // silent
    }
  }
}

// Au cas où `updateHomeStats` n'est pas exposé, remplir localement depuis `window.allMovies`
function fillHomeStatsFromWindow() {
  const movies = window.allMovies || [];
  if (!movies || movies.length === 0) return;

  const totalEl = document.getElementById('home-total-films');
  const topRatedEl = document.getElementById('home-top-rated');
  const mostRecentEl = document.getElementById('home-most-recent');

  if (totalEl) totalEl.textContent = movies.length > 1 ? `${movies.length} films` : `${movies.length} film`;

  if (topRatedEl) {
    const rated = movies.filter(m => typeof m.vote_average === 'number');
    if (!rated.length) topRatedEl.textContent = '—';
    else {
      const best = rated.reduce((a, b) => (b.vote_average > a.vote_average ? b : a));
      topRatedEl.textContent = `${best.title} (${best.vote_average.toFixed(1)})`;
    }
  }

  if (mostRecentEl) {
    const withDate = movies.filter(m => m.release_date);
    if (!withDate.length) mostRecentEl.textContent = '—';
    else {
      const recent = withDate.reduce((a, b) => (b.release_date > a.release_date ? b : a));
      mostRecentEl.textContent = `${recent.title} (${recent.release_date.slice(0,4)})`;
    }
  }
}

// Essayer de remplir immédiatement si possible
setTimeout(() => {
  if (!window.updateHomeStats) fillHomeStatsFromWindow();
}, 100);

