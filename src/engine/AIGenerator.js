// AI rakip üretimi — lig seviyesine göre hedeflenen toplam güç
import { GeneticsEngine } from './GeneticsEngine.js';

const NAMES = [
  'Çingene', 'Köfte', 'Karaşahin', 'Ateş Topu', 'Yıldırım', 'Çelik',
  'Gece Şahini', 'Baron', 'Kötü Çocuk', 'Zeytin', 'Bülbül', 'Aslan',
  'Süper Horoz', 'İmparator', 'Kral', 'Şampiyon', 'Haydut', 'Tornado',
];

// Lig başına hedeflenen toplam stat gücü
export const TIER_TOTAL = [90, 120, 155, 190, 235];

export function randomName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

export function createAI(leagueTier) {
  const tier = Math.max(0, Math.min(TIER_TOTAL.length - 1, leagueTier));
  const targetTotal = TIER_TOTAL[tier];
  const base = GeneticsEngine.createRooster(randomName(), GeneticsEngine.generateSeed());

  // Seed'in temel stat oranlarını koru, ama toplamı hedefe ölçekle
  const currentTotal = base.stats.power + base.stats.speed + base.stats.stamina;
  const scale = targetTotal / currentTotal;
  const power = Math.max(20, Math.round(base.stats.power * scale));
  const speed = Math.max(20, Math.round(base.stats.speed * scale));
  const stamina = Math.max(20, Math.round(base.stats.stamina * scale));

  const rooster = {
    ...base,
    stats: {
      ...base.stats,
      power,
      speed,
      stamina,
      maxHealth: stamina * 10,
    },
    hiddenStats: { ...base.hiddenStats },
  };
  rooster.isPlayer = false;
  rooster.isAI = true;
  return rooster;
}
