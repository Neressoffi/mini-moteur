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
  const path = hash.replace('#', '');

  const view = routes[path] || renderHomeView;
  root.innerHTML = '';
  view(root);
}

