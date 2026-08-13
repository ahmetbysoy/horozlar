// ============================================================
// TRADING ENGINE — Horoz Borsası (Bahis Kulübü)
// Her horozun piyasa değeri rastgele yürüyüşle dalgalanır.
// Fiyat geçmişi üretilir; grafikle gösterilir, al-sat yapılabilir.
// ============================================================

import { GeneticsEngine } from './GeneticsEngine.js';

// Bir horozun "baz değeri" (stat toplamından) — borsa dalgalanması için temel
export function baseValue(rooster) {
  const total = rooster.stats.power + rooster.stats.speed + rooster.stats.stamina;
  const rarityMult = { COMMON: 1, RARE: 1.5, EPIC: 2.5, LEGENDARY: 5 }[rooster.rarity] || 1;
  return Math.max(200, Math.floor(total * 8 * rarityMult));
}

// Fiyat geçmişi üret: başlangıçtan itibaren rastgele yürüyüş
// seed'e deterministik bağlı ki aynı horoz aynı trendi izlesin
export function generatePriceHistory(rooster, points = 12) {
  const base = baseValue(rooster);
  const seedVal = GeneticsEngine.simpleHash(rooster.seed || 'x');
  const history = [];
  let price = base * (0.85 + (seedVal % 30) / 100);
  for (let i = 0; i < points; i++) {
    // Rastgele yürüyüş: -%8 ile +%8
    const drift = (Math.random() - 0.48) * 0.16;
    price = Math.max(base * 0.6, price * (1 + drift));
    history.push({ t: i, price: Math.floor(price) });
  }
  return history;
}

// Güncel piyasa değeri (son fiyat)
export function currentValue(rooster, history) {
  if (!history || history.length === 0) return baseValue(rooster);
  return history[history.length - 1].price;
}

// Fiyat değişimi yüzdesi (son iki nokta arası)
export function priceChangePct(history) {
  if (!history || history.length < 2) return 0;
  const a = history[history.length - 2].price;
  const b = history[history.length - 1].price;
  if (a === 0) return 0;
  return ((b - a) / a) * 100;
}

// Borsa işlemi: kendi horozunu piyasa değerinden sat
// (değer düşükken satmak kötü, yüksekken satmak kârlı)
export function shouldSell(history) {
  return priceChangePct(history) > 5; // son trend yükselişteyse satmak iyi
}

// Grafik çizim verisi (canvas için normalize)
export function chartPoints(history, width = 260, height = 80) {
  if (!history || history.length < 2) return [];
  const min = Math.min(...history.map(p => p.price));
  const max = Math.max(...history.map(p => p.price));
  const range = max - min || 1;
  return history.map((p, i) => ({
    x: (i / (history.length - 1)) * width,
    y: height - ((p.price - min) / range) * (height - 10) - 5,
  }));
}
