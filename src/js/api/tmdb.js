// Petit client pour l'API TMDB
// Tu utilises ici un "v4 access token" (token long en JWT) -> il s'utilise
// avec un header Authorization: Bearer <TOKEN>, PAS comme api_key=...
// Docs : https://developer.themoviedb.org/docs/getting-started

const API_BASE_URL = "https://api.themoviedb.org/3";
// ⚠️ Mets ton token v4 ici. NE JAMAIS le committer sur GitHub en vrai projet.
const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwN2Q1NGZhYjViZjNkOGJmNzQ3OGI2ZjFmZTBjMDMzNSIsIm5iZiI6MTc3MDgxODIyMS45ODIsInN1YiI6IjY5OGM4YWFkZjkyZjQ4NzI1MmY3YjliOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.4p36o_31B5tJyx_F56kM-Zc03V_bYqYn0lY649C-OkE";
const DEFAULT_LANGUAGE = "fr-FR";

function buildUrl(path, params = {}) {
  const url = new URL(API_BASE_URL + path);
  url.searchParams.set("language", DEFAULT_LANGUAGE);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export async function fetchPopularMovies(page = 1) {
  const url = buildUrl("/movie/popular", { page });

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Erreur API TMDB (${response.status})`);
  }

  const data = await response.json();
  return data.results; // tableau de films
}

export async function fetchSimilarMovies(movieId, page = 1) {
  if (!movieId) throw new Error("movieId requis pour fetchSimilarMovies");

  const url = buildUrl(`/movie/${movieId}/similar`, { page });

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur API TMDB (${response.status})`);
  }

  const data = await response.json();
  return data.results; // tableau de films similaires
}
