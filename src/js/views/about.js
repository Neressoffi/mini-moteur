export function renderAboutView(root) {
  const container = document.createElement('section');
  container.className = 'view view-about';
  container.innerHTML = `
    <h2>À propos</h2>
    <p>
      Ce mini moteur de recommandation est un projet pédagogique basé sur l'API TMDB.
    </p>
    <p>
      Objectifs :
    </p>
    <ul>
      <li>Consommer une API REST (TMDB)</li>
      <li>Appliquer une logique de scoring simple</li>
      <li>Affiche un classement personnalisé de films</li>
    </ul>
  `;
  root.appendChild(container);
}

