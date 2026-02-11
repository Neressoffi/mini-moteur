export function renderRecommendationsView(root) {
  const container = document.createElement('section');
  container.className = 'view view-recommendations';
  container.innerHTML = `
    <h2>Recommandations de films</h2>
    <p>
      Ici nous afficherons la liste des films récupérés depuis l'API TMDB,
      puis nous ajouterons un système de scoring pour les classer.
    </p>
    <div id="movies-list" class="movies-list">
      <!-- Les cartes de films seront injectées ici via JS -->
    </div>
  `;
  root.appendChild(container);
}

