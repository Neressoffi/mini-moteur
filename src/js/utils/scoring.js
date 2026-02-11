export function scoreMovies(movies, weights = {}) {
  const w = {
    rating: 0.45,
    popularity: 0.2,
    recency: 0.2,
    votes: 0.15,
    ...weights,
  };

  const now = Date.now();

  // collect metric ranges
  let popMin = Infinity,
    popMax = -Infinity,
    votesMin = Infinity,
    votesMax = -Infinity,
    ageMin = Infinity,
    ageMax = -Infinity;

  const moviesData = movies.map((m) => {
    const popularity = Number(m.popularity) || 0;
    const votes = Number(m.vote_count) || 0;
    const rating = Number(m.vote_average) || 0; // 0..10

    let ageDays = Infinity;
    if (m.release_date) {
      const d = Date.parse(m.release_date);
      if (!Number.isNaN(d)) {
        ageDays = Math.max(0, Math.floor((now - d) / (1000 * 60 * 60 * 24)));
      }
    }

    if (popularity < popMin) popMin = popularity;
    if (popularity > popMax) popMax = popularity;
    if (votes < votesMin) votesMin = votes;
    if (votes > votesMax) votesMax = votes;
    if (ageDays < ageMin) ageMin = ageDays;
    if (ageDays > ageMax) ageMax = ageDays;

    return { raw: m, popularity, votes, rating, ageDays };
  });

  // normalize helper (handles equal min/max)
  const normalize = (v, min, max) => {
    if (!isFinite(v)) return 0;
    if (max === min) return 1;
    return (v - min) / (max - min);
  };

  // recency: lower ageDays -> more recent -> higher score
  const scored = moviesData.map((d) => {
    const ratingNorm = Math.max(0, Math.min(1, d.rating / 10));
    const popNorm = normalize(d.popularity, popMin, popMax);
    const votesNorm = normalize(d.votes, votesMin, votesMax);
    const ageNorm = ageMax === Infinity ? 0 : normalize(d.ageDays, ageMin, ageMax);
    const recencyNorm = 1 - ageNorm;

    const score =
      ratingNorm * w.rating +
      popNorm * w.popularity +
      recencyNorm * w.recency +
      votesNorm * w.votes;

    return { ...d.raw, _score: Number(score.toFixed(4)) };
  });

  // sort descending by score
  scored.sort((a, b) => b._score - a._score);
  return scored;
}

export function formatScore(score) {
  return Math.round(score * 100);
}
