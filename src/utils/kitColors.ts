/** Resolve jersey/shirt color — player override → team default. */
export function resolveKitColor(teamKitColor: string, playerKitColor?: string): string {
  return playerKitColor ?? teamKitColor;
}

/** Darken kit hex for trousers (auto when config has no trouserColor). */
export function trouserColorFromKit(kitHex: string): string {
  const h = kitHex.replace('#', '');
  if (h.length !== 6) return '#1a1a1a';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum < 0.25) return '#1a1a1a';
  const f = 0.32;
  const to = (n: number) => Math.round(n * f).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function resolveTrouserColor(teamKitColor: string, teamTrouserColor?: string, playerKitColor?: string): string {
  if (teamTrouserColor) return teamTrouserColor;
  return trouserColorFromKit(playerKitColor ?? teamKitColor);
}
