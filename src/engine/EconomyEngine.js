// ============================================================
// ECONOMY ENGINE — Bahis oranları, ödüller, pazar fiyatı
// Doküman §6.13 (bahis), §6.12 (ekonomi)
// ============================================================

export const BET_LIMITS = { min: 50, max: 10000, dailyMax: 10 };

// Bahis oranı: güç oranına göre + %5 ev avantajı
export function calculateBetOdds(playerTotal, opponentTotal) {
  if (opponentTotal <= 0 || playerTotal <= 0) return 2.0;
  const powerRatio = playerTotal / opponentTotal;
  let odds = (1 / powerRatio) * 1.05;
  odds = Math.max(1.1, Math.min(10.0, odds));
  return Math.round(odds * 100) / 100;
}

// Dövüş ödülü — lig bazlı (coin aralığı)
export function calculateFightReward(league, win) {
  const [min, max] = league.reward;
  const base = min + Math.floor(Math.random() * (max - min));
  return win ? base : Math.floor(base * 0.25);
}

// Pazar fiyatı: (toplam stat × 5) × rarity çarpanı
export function calculateMarketPrice(totalStats, rarity) {
  const mult = { COMMON: 1, RARE: 2, EPIC: 4, LEGENDARY: 10 }[rarity] || 1;
  return Math.max(150, Math.floor(totalStats * 5 * mult));
}

// PVP kodunu oluştur/decode (Base64 + sabit prefiks)
const PVP_PREFIX = 'HI-';

export function encodePVPCode(rooster) {
  const payload = {
    v: 1,
    name: rooster.name,
    seed: rooster.seed,
    breed: rooster.breed,
    element: rooster.element,
    stats: { power: rooster.stats.power, speed: rooster.stats.speed, stamina: rooster.stats.stamina },
    skills: (rooster.skills || []).map(s => s.id),
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return PVP_PREFIX + b64;
}

export function decodePVPCode(code) {
  try {
    const clean = code.trim().replace(/^HI-/, '');
    const json = decodeURIComponent(escape(atob(clean)));
    const data = JSON.parse(json);
    if (!data.seed || !data.stats) throw new Error('geçersiz');
    return {
      id: 'pvp_' + Math.random().toString(36).slice(2, 10),
      name: data.name || 'Rakip Horoz',
      seed: data.seed,
      breed: data.breed || 'CIVIC',
      element: data.element || 'FIRE',
      stats: data.stats,
      skills: data.skills || ['smash', 'heal'],
      genetics: { isMutated: false, generation: 1 },
      hiddenStats: { critChance: 0.1, dodgeChance: 0.1, panicThreshold: 0.2, lateGamePower: 3, maxPotential: 90 },
      discovered: { critChanceRevealed: true, dodgeChanceRevealed: true, panicRevealed: true, lateGameRevealed: true, potentialRevealed: true },
      battleStats: { fights: 0, wins: 0, losses: 0, kills: 0 },
      isPlayer: false,
      isPVP: true,
    };
  } catch (e) {
    return null;
  }
}
