// ============================================================
// GAME STORE — localStorage tabanlı kalıcı durum yönetimi
// Firebase olmadan tamamen oynanabilir çalışsın diye localStorage
// ============================================================
import { GeneticsEngine } from '../engine/GeneticsEngine.js';

const SAVE_KEY = 'horoz-imparatorlugu-save-v1';

const DEFAULT_STATE = {
  coins: 1000,
  diamonds: 2,
  energy: 100,
  energyMax: 100,
  lastRegenAt: Date.now(),
  level: 1,
  xp: 0,
  wins: 0,
  fights: 0,
  lastDailyClaim: '',
  roosters: [],
  roosterSeed: 1,
};

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function save(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function regen(state) {
  if (!state.lastRegenAt) state.lastRegenAt = Date.now();
  if (state.energy >= state.energyMax) return state;
  const elapsed = Date.now() - state.lastRegenAt;
  const gained = Math.floor(elapsed / (5 * 60 * 1000));
  if (gained > 0) {
    state.energy = Math.min(state.energyMax, state.energy + gained);
    state.lastRegenAt = Date.now();
  }
  return state;
}

const saved = load();
let state;
if (saved) {
  state = saved;
  if (!state.roosters) state.roosters = [];
} else {
  // İlk kurulum: bir başlangıç horozu ile başla
  state = {
    ...DEFAULT_STATE,
    lastRegenAt: Date.now(),
    roosters: [GeneticsEngine.createRooster('Kıro')],
  };
}
save(state);

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function commit() {
  regen(state);
  save(state);
  listeners.forEach(fn => fn({ ...state }));
}

export function getState() {
  regen(state);
  return { ...state };
}

export function getRoosters() {
  return state.roosters.map(r => ({ ...r }));
}

// ---------- Actions ----------

export function startNewGame() {
  const firstRooster = GeneticsEngine.createRooster('Kıro');
  state = {
    ...DEFAULT_STATE,
    lastRegenAt: Date.now(),
    roosters: [firstRooster],
  };
  commit();
  return getState();
}

export function generateRooster(name = null) {
  const rooster = GeneticsEngine.createRooster(name || `Horoz #${state.roosterSeed}`);
  state.roosters.push(rooster);
  state.roosterSeed++;
  commit();
  return rooster;
}

export function addCoins(amount) {
  state.coins = Math.max(0, state.coins + amount);
  commit();
}

export function addDiamonds(amount) {
  state.diamonds = Math.max(0, state.diamonds + amount);
  commit();
}

export function spendCoins(amount) {
  if (state.coins < amount) return false;
  state.coins -= amount;
  commit();
  return true;
}

export function spendEnergy(amount) {
  regen(state);
  if (state.energy < amount) return false;
  state.energy -= amount;
  state.lastRegenAt = Date.now();
  commit();
  return true;
}

export function refillEnergy() {
  state.energy = state.energyMax;
  state.lastRegenAt = Date.now();
  commit();
}

export function addXp(amount) {
  state.xp += amount;
  while (state.xp >= levelXp(state.level)) {
    state.xp -= levelXp(state.level);
    state.level++;
    state.energy = state.energyMax;
    state.lastRegenAt = Date.now();
  }
  commit();
}

export function levelXp(level) {
  return 100 * level;
}

export function updateRooster(id, patch) {
  const idx = state.roosters.findIndex(r => r.id === id);
  if (idx >= 0) {
    state.roosters[idx] = { ...state.roosters[idx], ...patch };
    commit();
  }
}

export function removeRooster(id) {
  state.roosters = state.roosters.filter(r => r.id !== id);
  commit();
}

export function recordFight(roosterId, won) {
  const idx = state.roosters.findIndex(r => r.id === roosterId);
  state.fights++;
  if (won) state.wins++;
  if (idx >= 0) {
    const r = state.roosters[idx];
    r.battleStats.fights++;
    if (won) { r.battleStats.wins++; r.battleStats.kills++; }
    else r.battleStats.losses++;
  }
  commit();
}

export function claimDaily() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDailyClaim === today) return false;
  state.lastDailyClaim = today;
  state.coins += 200;
  state.energy = state.energyMax;
  commit();
  return true;
}
