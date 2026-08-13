// AI rakip üretimi — lig seviyesine uygun rastgele horoz
import { GeneticsEngine } from './GeneticsEngine.js';

const NAMES = [
  'Çingene', 'Köfte', 'Karaşahin', 'Ateş Topu', 'Yıldırım', 'Çelik',
  'Gece Şahini', 'Baron', 'Kötü Çocuk', 'Zeytin', 'Bülbül', 'Aslan',
  'Süper Horoz', 'İmparator', 'Kral', 'Şampiyon', 'Haydut', 'Tornado',
];

export function randomName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

export function createAI(leagueTier) {
  // leagueTier: 0=çaylak ... 4=efsane
  let seed = GeneticsEngine.generateSeed();
  // Gücü yukarı çekmek için seed karakterlerini F'ye yaklaştır
  const power = 35 + leagueTier * 12;
  let attempts = 0;
  let rooster = GeneticsEngine.createRooster(randomName(), seed);
  // istatistik hedefine ulaşana kadar yeniden üret
  while (GeneticsEngine.totalStats(rooster) < power && attempts < 60) {
    seed = GeneticsEngine.generateSeed();
    rooster = GeneticsEngine.createRooster(randomName(), seed);
    attempts++;
  }
  rooster.isPlayer = false;
  rooster.isAI = true;
  return rooster;
}
