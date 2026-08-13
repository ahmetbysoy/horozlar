// ============================================================
// GENETICS ENGINE — Seed üretimi, parsing, ırk/element/rarity
// Doküman §6.1, §6.2, §6.3, §6.4, §6.5, §6.6
// ============================================================

export const BREED_BONUSES = {
  CIVIC:       { power: 5,  speed: 5,  stamina: 5  },  // Dengeli
  ASIL:        { power: 15, speed: 0,  stamina: 0  },  // Yüksek güç
  DENIZLI:     { power: 0,  speed: 15, stamina: 0  },  // Yüksek hız
  MODERN_GAME: { power: 0,  speed: 0,  stamina: 15 },  // Dayanıklı
  LEGENDARY:   { power: 10, speed: 10, stamina: 10 },  // Her şey yüksek
};

export const BREED_COLORS = {
  CIVIC:       { body: '#8B4513', comb: '#FF0000', beak: '#FFA500' },
  ASIL:        { body: '#DC143C', comb: '#8B0000', beak: '#FF6347' },
  DENIZLI:     { body: '#4169E1', comb: '#191970', beak: '#87CEEB' },
  MODERN_GAME: { body: '#808080', comb: '#C0C0C0', beak: '#A9A9A9' },
  LEGENDARY:   { body: '#FFD700', comb: '#FF8C00', beak: '#FFA07A' },
};

export const MUTATION_COLORS = ['#FF00FF', '#00FFFF', '#FFD700', '#FF4500', '#7B68EE'];

export const RARITY = {
  COMMON:    { color: '#9CA3AF', min: 0,   max: 159, label: 'Yaygın' },
  RARE:      { color: '#3B82F6', min: 160, max: 209, label: 'Nadir' },
  EPIC:      { color: '#A855F7', min: 210, max: 249, label: 'Efsanevi' },
  LEGENDARY: { color: '#F59E0B', min: 250, max: 999, label: 'Destansı' },
};

export const ELEMENT_MULTIPLIER = {
  FIRE:   { FIRE: 1.0, WATER: 0.75, NATURE: 1.5 },
  WATER:  { FIRE: 1.5, WATER: 1.0,  NATURE: 0.75 },
  NATURE: { FIRE: 0.75, WATER: 1.5, NATURE: 1.0 },
};

const SKILL_POOL = {
  smash:   { id: 'smash',   name: 'Ezici Darbe',    type: 'SMASH',  cooldown: 3, description: '%180 hasar' },
  heal:    { id: 'heal',    name: 'İyileşme',       type: 'HEAL',   cooldown: 4, description: '%40 can yenileme' },
  rage:    { id: 'rage',    name: 'Öfke',           type: 'RAGE',   cooldown: 5, description: '3 tur %50 hasar bonusu' },
  poison:  { id: 'poison',  name: 'Zehirli Gaga',   type: 'POISON', cooldown: 4, description: '3 tur zehir hasarı' },
  shield:  { id: 'shield',  name: 'Kalkan',         type: 'SHIELD', cooldown: 5, description: '2 tur hasar azaltma' },
  divine:  { id: 'divine',  name: 'İlahi Darbe',    type: 'DIVINE', cooldown: 6, description: '3x hasar + iyileşme' },
};

const BREED_SKILL = {
  CIVIC: 'heal', ASIL: 'rage', DENIZLI: 'poison', MODERN_GAME: 'shield', LEGENDARY: 'divine',
};

export function makeId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return 'r' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class GeneticsEngine {
  static generateSeed() {
    const chars = '0123456789ABCDEF';
    let seed = '';
    for (let i = 0; i < 16; i++) {
      seed += chars[Math.floor(Math.random() * 16)];
      if (i === 3 || i === 7 || i === 11) seed += '-';
    }
    return seed;
  }

  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  static parseSeed(seed) {
    const clean = seed.replace(/-/g, '');
    const groups = [
      clean.substring(0, 4),
      clean.substring(4, 8),
      clean.substring(8, 12),
      clean.substring(12, 16),
    ];
    const h = groups.map(g => this.simpleHash(g));

    const power = 30 + (h[0] % 71);
    const speed = 30 + (h[1] % 71);
    const stamina = 30 + (h[2] % 71);

    const hh = h[3];
    const critChance = 0.05 + ((hh % 21) / 100);
    const dodgeChance = 0.05 + (((hh >> 5) % 16) / 100);
    const panicThreshold = 0.15 + (((hh >> 10) % 16) / 100);
    const lateGamePower = (hh >> 15) % 16;
    const maxPotential = 80 + (hh % 21);

    return {
      stats: { power, speed, stamina, maxHealth: stamina * 10 },
      hiddenStats: { critChance, dodgeChance, panicThreshold, lateGamePower, maxPotential },
    };
  }

  static determineBreed(seed) {
    const val = parseInt(seed[0], 16);
    if (val <= 5) return 'CIVIC';
    if (val <= 8) return 'ASIL';
    if (val <= 11) return 'DENIZLI';
    if (val <= 13) return 'MODERN_GAME';
    return 'LEGENDARY';
  }

  static determineElement(seed) {
    const clean = seed.replace(/-/g, '');
    const val = parseInt(clean[clean.length - 1], 16);
    if (val <= 4) return 'FIRE';
    if (val <= 9) return 'WATER';
    return 'NATURE';
  }

  static determineRarity(stats) {
    const total = stats.power + stats.speed + stats.stamina;
    for (const key of ['LEGENDARY', 'EPIC', 'RARE']) {
      if (total >= RARITY[key].min) return key;
    }
    return 'COMMON';
  }

  static createRooster(name, existingSeed = null) {
    const seed = existingSeed || this.generateSeed();
    const breed = this.determineBreed(seed);
    const element = this.determineElement(seed);
    const { stats, hiddenStats } = this.parseSeed(seed);

    const bb = BREED_BONUSES[breed];
    stats.power += bb.power;
    stats.speed += bb.speed;
    stats.stamina += bb.stamina;
    stats.maxHealth = stats.stamina * 10;

    const rarity = this.determineRarity(stats);

    return {
      id: makeId(),
      name,
      seed,
      breed,
      element,
      rarity,
      level: 1,
      xp: 0,
      stats: { ...stats, potential: hiddenStats.maxPotential },
      hiddenStats,
      skills: this.assignDefaultSkills(breed),
      equipment: { beak: null, feather: null, claw: null },
      genetics: { isMutated: false, mutationColor: null, parentSeeds: null, generation: 1 },
      battleStats: { fights: 0, wins: 0, losses: 0, kills: 0 },
      discovered: {
        critChanceRevealed: false, dodgeChanceRevealed: false,
        panicRevealed: false, lateGameRevealed: false, potentialRevealed: false,
      },
      createdAt: new Date().toISOString(),
    };
  }

  static assignDefaultSkills(breed) {
    const base = [{ ...SKILL_POOL.smash, currentCooldown: 0 }];
    const breedSkillId = BREED_SKILL[breed] || 'heal';
    base.push({ ...SKILL_POOL[breedSkillId], currentCooldown: 0 });
    return base;
  }

  static breed(parent1Seed, parent2Seed) {
    const c1 = parent1Seed.replace(/-/g, '');
    const c2 = parent2Seed.replace(/-/g, '');
    let child = '';
    for (let i = 0; i < 16; i++) {
      child += Math.random() < 0.5 ? c1[i] : c2[i];
      if (Math.random() < 0.05) {
        child = child.slice(0, -1) + '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
      }
      if (i === 3 || i === 7 || i === 11) child += '-';
    }
    return child;
  }

  static totalStats(rooster) {
    return rooster.stats.power + rooster.stats.speed + rooster.stats.stamina;
  }
}

export const BREED_LABEL = {
  CIVIC: 'Sivil', ASIL: 'Asil', DENIZLI: 'Denizli', MODERN_GAME: 'Modern', LEGENDARY: 'Efsane',
};

export const ELEMENT_LABEL = { FIRE: 'Ateş', WATER: 'Su', NATURE: 'Doğa' };
