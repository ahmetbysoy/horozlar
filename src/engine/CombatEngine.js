// ============================================================
// COMBAT ENGINE — Hasar formülü, round simülasyonu, yetenekler
// Doküman §6.7
// ============================================================
import { ELEMENT_MULTIPLIER } from './GeneticsEngine.js';

export function calculateDamage(attacker, defender, round, rhythmMult = 1.0, skillMult = 1.0) {
  let baseDamage = attacker.stats.power * (0.5 + round * 0.05);
  baseDamage *= (ELEMENT_MULTIPLIER[attacker.element] || {})[defender.element] ?? 1.0;

  if (round >= 7) baseDamage += attacker.hiddenStats.lateGamePower * (round - 6);

  const defense = defender.stats.stamina * 0.3;
  baseDamage -= defense;

  baseDamage *= (0.9 + Math.random() * 0.2);
  baseDamage *= skillMult;

  let isCrit = false;
  if (Math.random() < attacker.hiddenStats.critChance) { baseDamage *= 2.0; isCrit = true; }

  let isDodged = false;
  if (Math.random() < defender.hiddenStats.dodgeChance) { baseDamage = 0; isDodged = true; }

  const dmgReduction = defender.buffs.find(b => b.type === 'DAMAGE_REDUCTION');
  if (dmgReduction && !isDodged) baseDamage *= 0.5;

  baseDamage *= rhythmMult;

  if (!isDodged) baseDamage = Math.max(1, Math.floor(baseDamage));

  return { damage: Math.floor(baseDamage), isCrit, isDodged };
}

export class CombatEngine {
  constructor(rooster1, rooster2, options = {}) {
    this.fighter1 = this.prepareFighter(rooster1);
    this.fighter2 = this.prepareFighter(rooster2);
    this.round = 0;
    this.maxRounds = options.maxRounds || 10;
    this.log = [];
    this.isFinished = false;
    this.winner = null;
  }

  prepareFighter(rooster) {
    return {
      ...JSON.parse(JSON.stringify(rooster)),
      currentHealth: rooster.stats.maxHealth,
      buffs: [], debuffs: [], rageMeter: 0, isPanicking: false,
    };
  }

  determineTurnOrder() {
    const s1 = this.fighter1.stats.speed, s2 = this.fighter2.stats.speed;
    if (s1 > s2) return [this.fighter1, this.fighter2];
    if (s2 > s1) return [this.fighter2, this.fighter1];
    return Math.random() < 0.5 ? [this.fighter1, this.fighter2] : [this.fighter2, this.fighter1];
  }

  getBuffMult(fighter) {
    const boost = fighter.buffs.find(b => b.type === 'DAMAGE_BOOST');
    return boost ? boost.multiplier : 1.0;
  }

  attack(attacker, defender, rhythmMult = 1.0, skillMult = 1.0) {
    const result = calculateDamage(attacker, defender, this.round, rhythmMult, skillMult * this.getBuffMult(attacker));
    if (!result.isDodged) {
      defender.currentHealth = Math.max(0, defender.currentHealth - result.damage);
      attacker.rageMeter = Math.min(100, attacker.rageMeter + 5);
    }
    return result;
  }

  tickBuffs(fighter) {
    fighter.buffs = fighter.buffs.filter(b => { b.turns--; return b.turns > 0; });
    fighter.debuffs = fighter.debuffs.filter(d => { d.turns--; return d.turns > 0; });
    fighter.skills.forEach(s => { if (s.currentCooldown > 0) s.currentCooldown--; });
  }

  applyPoison(fighter, roundLog) {
    const poison = fighter.debuffs.find(d => d.type === 'POISON');
    if (poison) {
      fighter.currentHealth = Math.max(0, fighter.currentHealth - poison.damage);
      roundLog.actions.push({ type: 'POISON_TICK', target: fighter.name, damage: poison.damage });
    }
  }

  checkPanic(fighter) {
    const pct = fighter.currentHealth / fighter.stats.maxHealth;
    fighter.isPanicking = pct < fighter.hiddenStats.panicThreshold;
  }

  simulateRound(playerSkillId = null, rhythmMult = 1.0) {
    if (this.isFinished) return null;
    this.round++;
    const [first, second] = this.determineTurnOrder();
    const roundLog = { round: this.round, actions: [] };

    this.tickBuffs(first); this.tickBuffs(second);
    this.applyPoison(first, roundLog); this.applyPoison(second, roundLog);
    this.checkPanic(first); this.checkPanic(second);

    // Oyuncu skill (varsa) ilk sıradaki horozun sahibi oyuncuysa
    const playerFighter = this.fighter1.isPlayer ? this.fighter1 : this.fighter2;
    if (playerSkillId && playerFighter.currentHealth > 0) {
      this.useSkill(playerFighter, playerSkillId, playerFighter === this.fighter1 ? this.fighter2 : this.fighter1, roundLog);
    }

    if (second.currentHealth > 0) {
      const r1 = this.attack(first, second, rhythmMult);
      roundLog.actions.push({ attacker: first.name, ...r1 });
    }
    if (first.currentHealth > 0 && second.currentHealth > 0) {
      const r2 = this.attack(second, first, 1.0);
      roundLog.actions.push({ attacker: second.name, ...r2 });
    }

    first.rageMeter = Math.min(100, first.rageMeter + 10);
    second.rageMeter = Math.min(100, second.rageMeter + 10);

    if (this.fighter1.currentHealth <= 0 || this.fighter2.currentHealth <= 0) {
      this.isFinished = true;
      this.winner = this.fighter1.currentHealth > 0 ? this.fighter1 : this.fighter2;
    } else if (this.round >= this.maxRounds) {
      this.isFinished = true;
      this.winner = this.fighter1.currentHealth >= this.fighter2.currentHealth ? this.fighter1 : this.fighter2;
    }

    this.log.push(roundLog);
    return roundLog;
  }

  useSkill(fighter, skillId, target, roundLog) {
    const skill = fighter.skills.find(s => s.id === skillId);
    if (!skill || skill.currentCooldown > 0) return false;
    skill.currentCooldown = skill.cooldown;
    let msg = null;

    switch (skill.type) {
      case 'SMASH':
        target.currentHealth = Math.max(0, target.currentHealth - Math.floor(fighter.stats.power * 1.8));
        msg = `${fighter.name} EZİCİ DARBE kullandı!`;
        break;
      case 'HEAL':
        fighter.currentHealth = Math.min(fighter.stats.maxHealth, fighter.currentHealth + Math.floor(fighter.stats.maxHealth * 0.4));
        msg = `${fighter.name} İyileşme kullandı (+%40 can)`;
        break;
      case 'RAGE':
        fighter.buffs.push({ type: 'DAMAGE_BOOST', multiplier: 1.5, turns: 3 });
        msg = `${fighter.name} ÖFKE kullandı (3 tur +%50 hasar)`;
        break;
      case 'POISON':
        target.debuffs.push({ type: 'POISON', damage: 15, turns: 3 });
        msg = `${fighter.name} Zehirli Gaga kullandı!`;
        break;
      case 'SHIELD':
        fighter.buffs.push({ type: 'DAMAGE_REDUCTION', multiplier: 0.5, turns: 2 });
        msg = `${fighter.name} Kalkan kullandı (2 tur -%50 hasar)`;
        break;
      case 'DIVINE':
        target.currentHealth = Math.max(0, target.currentHealth - Math.floor(fighter.stats.power * 3));
        fighter.currentHealth = Math.min(fighter.stats.maxHealth, fighter.currentHealth + Math.floor(fighter.stats.maxHealth * 0.2));
        msg = `${fighter.name} İLAHİ DARBE kullandı!`;
        break;
    }
    if (msg) roundLog.actions.push({ type: 'SKILL', attacker: fighter.name, message: msg });
    return true;
  }

  simulateFullBattle(playerSkillFn = null) {
    let guard = 0;
    while (!this.isFinished && guard < 30) {
      this.simulateRound(playerSkillFn ? playerSkillFn(this.round) : null, 1.0);
      guard++;
    }
    return this.winner;
  }
}
