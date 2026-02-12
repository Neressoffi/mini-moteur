// Routage très simple basé sur le hash (#/route)

import { renderHomeView } from './views/home.js';
import { renderRecommendationsView } from './views/recommendations.js';
import { renderAboutView } from './views/about.js';

const routes = {
  '/': renderHomeView,
  '/recommandations': renderRecommendationsView,
  '/a-propos': renderAboutView,
};

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

function handleRouteChange() {
  const root = document.getElementById('app-root');
  const hash = window.location.hash || '#/';
  const raw = hash.replace('#', ''); // ex: '/recommandations/123' ou '/'

  // découper les segments pour récupérer un éventuel id: #/recommandations/123
  const segments = raw.split('/').filter(Boolean); // ['recommandations','123']
  const base = '/' + (segments[0] || '');
  const params = {};
  if (segments[1]) {
    const id = parseInt(segments[1], 10);
    if (!Number.isNaN(id)) params.id = id;
  }

  const view = routes[base] || renderHomeView;
  root.innerHTML = '';
  // les vues peuvent accepter (root, params)
  view(root, params);
}

