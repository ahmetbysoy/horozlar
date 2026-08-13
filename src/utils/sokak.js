// ============================================================
// İSTANBUL ARKA SOKAK JARGONU
// Tüm oyunda kullanılan sokak Türkçesi sözlüğü ve hazır cümleler
// ============================================================

// Mekanlar
export const MECHAN = {
  home: 'Sokak',
  roosters: 'Kümes',
  combat: 'Meydan',
  market: 'Karaborsa',
  quests: 'İşler',
  clan: 'Tayfa',
  profile: 'Kimlik',
  leaderboard: 'Sıralama',
  borsa: 'Bahis Kulübü',
};

// Karakter adlandırma
export const ROOSTER_PREFIX = ['Kara', 'Deli', 'Sert', 'Jilet', 'Barut', 'Kabus', 'Zehir', 'Çakal', 'Kızgın', 'Sinsi', 'Tetik', 'Yamuk'];
export const ROOSTER_SUFFIX = ['Gaga', 'Pençe', 'Kanat', 'Bela', 'Efe', 'Reis', 'Cellat', 'Kabadayı', 'Serseri', 'Koz'];

export function sokakIsim() {
  const p = ROOSTER_PREFIX[Math.floor(Math.random() * ROOSTER_PREFIX.length)];
  const s = ROOSTER_SUFFIX[Math.floor(Math.random() * ROOSTER_SUFFIX.length)];
  return `${p} ${s}`;
}

// Sokak deyimleri
export const DOLU = [
  'Bu işin altından kalkarız, kanka.',
  'Gözünü seveyim, bu akşam çok iş var.',
  'Kafa rahat, muhabbet koyu. Buyur gel.',
  'Uyanık ol, bu mahallede herkes çakal.',
  'Boş ver abi, burada kural yok, fırsat var.',
  'Tayfa tamam mı? Hadi bakalım meydana.',
  'Kıytırık horozla buraya gelme, beni bozar.',
  'Ne işin var bu sokakta koçum? Hoş geldin!',
  'Gözüm üstünde, yamuk yapma.',
  'Bu arka sokakta kazanan konuşur.',
];

export function sokakLaf() {
  return DOLU[Math.floor(Math.random() * DOLU.length)];
}

// Ünvanlar (prestij/seviye bazlı)
export function unvan(level) {
  if (level < 3) return 'Çaylak';
  if (level < 6) return 'Mahalleli';
  if (level < 10) return 'Sokak Ağası';
  if (level < 15) return 'Kabadayı';
  if (level < 20) return 'Bahisçi Reisi';
  if (level < 30) return 'Meydanın Efendisi';
  return 'İmparator';
}

// Para birimi sokak isimleri
export const COIN = '🟡 Papel';
export const DIAMOND = '💎 Tokat';
export const ENERGY = '⚡ Nefes';

// Jargonlu toast / geri bildirim şablonları
export const J = {
  kazandin: '🏆 O parayı kaptın!',
  kaybettin: '😤 Ayağın denk gelmedi, zarar.',
  enerjiYok: '⚡ Nefesin yetmedi, biraz bekle.',
  paraYok: '🟡 Papelin yetmiyor koçum.',
  alindi: '✅ Söz, parayı sildik.',
  hosGeldin: '🪶 Hoş geldin mahalleye, koçum!',
};

export default { MECHAN, sokakIsim, sokakLaf, unvan, COIN, DIAMOND, ENERGY, J };
