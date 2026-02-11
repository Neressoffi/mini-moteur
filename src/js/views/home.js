export function renderHomeView(root) {
  const container = document.createElement('section');
  container.className = 'view view-home';
  container.innerHTML = `
    <h2>Bienvenue 👋</h2>
    <p>
      Cette application va utiliser l'API TMDB pour vous proposer des recommandations
      de films basées sur des critères personnalisables.
    </p>
    <p>
      Commencez par aller dans l'onglet <strong>Recommandations</strong> pour voir la liste
      des films populaires (dans un premier temps), puis nous ajouterons la logique
      de scoring ensemble.
    </p>
  `;
  root.appendChild(container);
}

