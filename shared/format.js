export function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatTotal(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return m ? `${h} hr ${m} min` : `${h} hr`;
  if (m) return `${m} min ${s % 60} sec`;
  return `${s} sec`;
}

export const formatCount = (n) => Number(n || 0).toLocaleString("en-US");

export const artistNames = (track) => track.artists.map((a) => a.name).join(", ");
