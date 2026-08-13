// ============================================================
// LEADERBOARD ENGINE — Global lider tablosu
// Skorlar /horoz/meta/lb/{playerId} altında saklanır; herkes okuyabilir
// ============================================================
import { fdb, getPlayerId } from '../config/firebase.js';

// Oyuncunun skorunu buluta yaz (debounce yok — işlem sonrası çağrılır)
export async function updateLeaderboardEntry(stats) {
  try {
    const pid = getPlayerId();
    const name = displayName();
    const entry = {
      name,
      prestige: stats.prestigePoints || 0,
      wins: stats.wins || 0,
      totalPower: stats.totalPower || 0,
      level: stats.level || 1,
      seasonXp: stats.seasonXp || 0,
      fights: stats.fights || 0,
      clanId: stats.clanId || null,
      updatedAt: Date.now(),
    };
    await fdb.set(`${fdb.metaPath('lb')}/${encodeURIComponent(pid)}`, entry);
  } catch (e) { /* offline — yoksay */ }
}

// Tüm skorları çek ve sırala
export async function fetchLeaderboard() {
  try {
    const data = await fdb.get(fdb.metaPath('lb'));
    if (!data) return [];
    const entries = Object.entries(data).map(([id, v]) => ({
      id,
      ...(v || {}),
      name: v?.name || 'Oyuncu',
    }));
    return entries;
  } catch (e) {
    return [];
  }
}

export function sortByMode(entries, mode) {
  const sorted = [...entries];
  switch (mode) {
    case 'prestige': sorted.sort((a, b) => (b.prestige || 0) - (a.prestige || 0)); break;
    case 'power': sorted.sort((a, b) => (b.totalPower || 0) - (a.totalPower || 0)); break;
    case 'wins': sorted.sort((a, b) => (b.wins || 0) - (a.wins || 0)); break;
    case 'season': sorted.sort((a, b) => (b.seasonXp || 0) - (a.seasonXp || 0)); break;
    default: sorted.sort((a, b) => (b.prestige || 0) - (a.prestige || 0));
  }
  return sorted;
}

function displayName() {
  try {
    const tg = window?.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tg?.first_name) return (tg.first_name + (tg.last_name ? ' ' + tg.last_name : '')).trim();
  } catch (e) { /* ignore */ }
  const local = localStorage.getItem('horoz-device-name');
  return local || 'Çiftçi';
}

// Madalya/rank etiketi
export function rankMedal(i) {
  return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
}
