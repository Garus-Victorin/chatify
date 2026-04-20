const COLORS = [
  { bg: "#f87171", text: "#ffffff" }, // red
  { bg: "#fb923c", text: "#ffffff" }, // orange
  { bg: "#fbbf24", text: "#ffffff" }, // amber
  { bg: "#34d399", text: "#ffffff" }, // emerald
  { bg: "#38bdf8", text: "#ffffff" }, // sky
  { bg: "#818cf8", text: "#ffffff" }, // indigo
  { bg: "#c084fc", text: "#ffffff" }, // purple
  { bg: "#f472b6", text: "#ffffff" }, // pink
  { bg: "#2dd4bf", text: "#ffffff" }, // teal
  { bg: "#a3e635", text: "#ffffff" }, // lime
];

export function getAvatarColor(seed: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function getInitial(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  return source[0].toUpperCase();
}
