// ============================================================
// SEASON ENGINE — 30 günlük sezon döngüsü, görevler, ödüller (§6.22)
// ============================================================

const SEASON_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;
// Sabit başlangıç: 2025-01-01 UTC
const SEASON_EPOCH = Date.UTC(2025, 0, 1);

export function seasonInfo() {
  const now = Date.now();
  const idx = Math.floor((now - SEASON_EPOCH) / SEASON_LENGTH_MS) + 1;
  const start = SEASON_EPOCH + (idx - 1) * SEASON_LENGTH_MS;
  const end = start + SEASON_LENGTH_MS;
  const remain = end - now;
  const daysLeft = Math.max(0, Math.ceil(remain / (24 * 60 * 60 * 1000)));
  return { number: idx, start, end, daysLeft };
}

// Sezon görevleri (XP hedefleri) — ödüller örnek
export const SEASON_QUESTS = [
  { id: 'sfight20', label: '⚔️ 20 dövüş kazan', target: 20, rewardCoins: 2000, rewardDiamonds: 1 },
  { id: 'sfight50', label: '⚔️ 50 dövüş kazan', target: 50, rewardCoins: 5000, rewardDiamonds: 2 },
  { id: 'sfight100', label: '⚔️ 100 dövüş kazan', target: 100, rewardCoins: 12000, rewardDiamonds: 5 },
];

export function formatDuration(ms) {
  const d = Math.floor(ms / (24 * 3600 * 1000));
  const h = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
  return `${d}g ${h}s`;
}
