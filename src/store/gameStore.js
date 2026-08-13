// ============================================================
// GAME STORE — Firebase Realtime Database ile bulut senkronizasyonu
// Veriler "/horoz/v1/{playerId}" altında saklanır.
// localStorage yalnızca offline yedek + anlık render için kullanılır.
// ============================================================
import { GeneticsEngine } from '../engine/GeneticsEngine.js';
import { fdb, getPlayerId } from '../config/firebase.js';

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
  equipment: [],
  roosterSeed: 1,
  // Prestij & Miras (§6.20)
  prestigePoints: 0,
  mirasPoints: 0,
  prestigeCount: 0,
  yadigarlar: [],
  // Klan (§6.19)
  clanId: null,
  // Sezon (§6.22)
  seasonXp: 0,
  seasonClaimed: [],
  savedAt: 0,
};

// ---------- localStorage (offline yedek + anlık render) ----------
function loadLocal() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { return null; }
}
function saveLocal(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ---------- Firebase RTDB ----------
let saveTimer = null;
async function persistToCloud(state) {
  try {
    const payload = { ...state, savedAt: Date.now() };
    await fdb.set('state', payload);
  } catch (e) { /* offline vb. — yedekte kalır */ }
}
function scheduleCloudSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persistToCloud(state), 600);
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

// Başlangıç durumu: local yedekten gelir (anlık render), sonra buluttan gelir
let state = loadLocal();
if (!state) {
  state = { ...DEFAULT_STATE, lastRegenAt: Date.now(), roosters: [GeneticsEngine.createRooster('Kıro')] };
}
if (!state.roosters) state.roosters = [];
if (!state.equipment) state.equipment = [];
saveLocal(state);

const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function emit() { listeners.forEach(fn => fn({ ...state })); }

function commit() {
  regen(state);
  saveLocal(state);
  scheduleCloudSave();
  emit();
}

export function getState() { regen(state); return { ...state }; }
export function getRoosters() { return state.roosters.map(r => ({ ...r })); }

// ---------- Buluttan yükleme (kaynak otoritesi: sunucu) ----------
export async function initFromCloud() {
  try {
    const remote = await fdb.get('state');
    if (remote && typeof remote === 'object' && remote.savedAt) {
      // Sunucu versiyonu daha yeni/seçili ise onu kullan
      const merged = { ...DEFAULT_STATE, ...remote };
      if (!merged.roosters) merged.roosters = [];
      if (!merged.equipment) merged.equipment = [];
      state = regen(merged);
      saveLocal(state);
      emit();
      return true;
    }
    // Sunucuda veri yoksa yerel durumu buluta ilk kez yaz
    scheduleCloudSave();
    return true;
  } catch (e) {
    // Çevrimdışı — yerel durumla devam
    scheduleCloudSave();
    return false;
  }
}

// ---------- Actions ----------

export function startNewGame() {
  state = { ...DEFAULT_STATE, lastRegenAt: Date.now(), roosters: [GeneticsEngine.createRooster('Kıro')], equipment: [] };
  commit();
  return getState();
}

// Yadigar (relic) pasif bonuslarını hesapla — yeni horozlara uygulanır (§6.20)
export function relicBonuses() {
  const bonus = { power: 0, speed: 0, stamina: 0, crit: 0, dmg: 0, hp: 0 };
  (state.yadigarlar || []).forEach(id => {
    const r = RELICS.find(x => x.id === id);
    if (r) {
      bonus.power += r.bonus.power || 0;
      bonus.speed += r.bonus.speed || 0;
      bonus.stamina += r.bonus.stamina || 0;
      bonus.crit += r.bonus.crit || 0;
      bonus.dmg += r.bonus.dmg || 0;
      bonus.hp += r.bonus.hp || 0;
    }
  });
  return bonus;
}

export function generateRooster(name = null) {
  const rooster = GeneticsEngine.createRooster(name || `Horoz #${state.roosterSeed}`);
  // Yadigar bonuslarını uygula
  const rb = relicBonuses();
  rooster.stats.power += rb.power;
  rooster.stats.speed += rb.speed;
  rooster.stats.stamina += rb.stamina;
  rooster.stats.maxHealth = rooster.stats.stamina * 10 + rb.hp;
  rooster.hiddenStats.critChance = Math.min(0.25, rooster.hiddenStats.critChance + rb.crit);
  state.roosters.push(rooster);
  state.roosterSeed++;
  commit();
  return rooster;
}

export function addCoins(amount) { state.coins = Math.max(0, state.coins + amount); commit(); }
export function addDiamonds(amount) { state.diamonds = Math.max(0, state.diamonds + amount); commit(); }

export function spendCoins(amount) {
  if (state.coins < amount) return false;
  state.coins -= amount; commit(); return true;
}

export function spendEnergy(amount) {
  regen(state);
  if (state.energy < amount) return false;
  state.energy -= amount; state.lastRegenAt = Date.now(); commit(); return true;
}

export function refillEnergy() { state.energy = state.energyMax; state.lastRegenAt = Date.now(); commit(); }

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

export function levelXp(level) { return 100 * level; }

export function updateRooster(id, patch) {
  const idx = state.roosters.findIndex(r => r.id === id);
  if (idx >= 0) { state.roosters[idx] = { ...state.roosters[idx], ...patch }; commit(); }
}

export function removeRooster(id) {
  state.roosters = state.roosters.filter(r => r.id !== id); commit();
}

export function recordFight(roosterId, won, leagueTier = 0) {
  const idx = state.roosters.findIndex(r => r.id === roosterId);
  state.fights++;
  if (won) {
    state.wins++;
    // Prestij puanı: kazanınca lig seviyesine göre (§6.12)
    const tierMult = [10, 25, 50, 100, 200][leagueTier] || 10;
    state.prestigePoints += tierMult;
    // Sezon XP
    state.seasonXp += tierMult;
  }
  if (idx >= 0) {
    const r = state.roosters[idx];
    r.battleStats.fights++;
    if (won) { r.battleStats.wins++; r.battleStats.kills++; } else r.battleStats.losses++;
  }
  commit();
}

// ---------- Prestij & Miras (§6.20) ----------

// Prestij sıfırla: tüm horozları/coini sıfırla, Miras Puanı kazan, yadigarlar & elmas korunur
export function prestigeReset() {
  if (state.prestigePoints < 5000) return { ok: false, message: 'En az 5000 prestij gerekli' };
  const mpGain = Math.floor(state.prestigePoints / 100);
  const keptDiamonds = state.diamonds;
  const keptRelics = state.yadigarlar;
  state = {
    ...DEFAULT_STATE,
    lastRegenAt: Date.now(),
    roosters: [GeneticsEngine.createRooster('Kıro')],
    equipment: [],
    diamonds: keptDiamonds,
    mirasPoints: (state.mirasPoints || 0) + mpGain,
    prestigeCount: (state.prestigeCount || 0) + 1,
    yadigarlar: keptRelics,
    clanId: state.clanId,
  };
  commit();
  return { ok: true, mpGain, prestigeCount: state.prestigeCount };
}

export function buyRelic(relicId) {
  const relic = RELICS.find(r => r.id === relicId);
  if (!relic) return false;
  if ((state.mirasPoints || 0) < relic.cost) return false;
  if (state.yadigarlar.includes(relicId)) return false;
  state.mirasPoints -= relic.cost;
  state.yadigarlar.push(relicId);
  commit();
  return true;
}

export function getPrestige() {
  return {
    prestigePoints: state.prestigePoints,
    mirasPoints: state.mirasPoints,
    prestigeCount: state.prestigeCount,
    yadigarlar: [...(state.yadigarlar || [])],
  };
}

// ---------- Klan (§6.19) ----------
export function setClanId(clanId) { state.clanId = clanId; commit(); }

// ---------- Sezon (§6.22) ----------
export function claimSeasonReward(index) {
  if (state.seasonClaimed.includes(index)) return false;
  state.seasonClaimed.push(index);
  // Basit ödül: her sezon görevine ödül ekleyen mekanizma SeasonEngine'de
  commit();
  return true;
}

export function getSeason() {
  return { seasonXp: state.seasonXp, seasonClaimed: [...state.seasonClaimed] };
}

// ---------- Relic catalog (§6.20) ----------
export const RELICS = [
  { id: 'altin_tuy', name: 'Altın Tüy', desc: '+5 tüm stat başlangıç', cost: 10, bonus: { power: 5, speed: 5, stamina: 5 } },
  { id: 'ejder_goz', name: 'Ejder Göz', desc: '+%10 kritik başlangıç', cost: 20, bonus: { crit: 0.10 } },
  { id: 'antik_gaga', name: 'Antik Gaga', desc: '+%15 hasar başlangıç', cost: 30, bonus: { dmg: 0.15 } },
  { id: 'tanri_kalkani', name: 'Tanrı Kalkanı', desc: '+500 başlangıç HP', cost: 50, bonus: { hp: 500 } },
];

export function claimDaily() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDailyClaim === today) return false;
  state.lastDailyClaim = today;
  state.coins += 200;
  state.energy = state.energyMax;
  commit(); return true;
}

// ---------- Equipment ----------

export function buyEquipment(item) {
  if (item.cost.diamonds) { if (state.diamonds < item.cost.diamonds) return false; state.diamonds -= item.cost.diamonds; }
  if (item.cost.coins) { if (state.coins < item.cost.coins) return false; state.coins -= item.cost.coins; }
  state.equipment.push({ id: item.id, name: item.name, slot: item.slot, rarity: item.rarity, stat: item.stat, value: item.value, equippedTo: null });
  commit(); return true;
}

export function equipEquipment(itemId, roosterId) {
  const item = state.equipment.find(i => i.id === itemId);
  if (!item) return false;
  const rooster = state.roosters.find(r => r.id === roosterId);
  if (!rooster) return false;

  const prevOwner = state.roosters.find(r => r.id !== roosterId && r.equipment && r.equipment[item.slot.toLowerCase()] === itemId);
  if (prevOwner) prevOwner.equipment[item.slot.toLowerCase()] = null;

  const slotKey = item.slot.toLowerCase();
  const existingItemId = rooster.equipment && rooster.equipment[slotKey];
  if (existingItemId) { const existing = state.equipment.find(i => i.id === existingItemId); if (existing) existing.equippedTo = null; }

  item.equippedTo = roosterId;
  if (!rooster.equipment) rooster.equipment = { beak: null, feather: null, claw: null };
  rooster.equipment[slotKey] = itemId;
  commit(); return true;
}

export function unequipEquipment(itemId, roosterId) {
  const item = state.equipment.find(i => i.id === itemId);
  const rooster = state.roosters.find(r => r.id === roosterId);
  if (item) item.equippedTo = null;
  if (rooster && rooster.equipment) { const slotKey = item ? item.slot.toLowerCase() : ''; if (rooster.equipment[slotKey] === itemId) rooster.equipment[slotKey] = null; }
  commit(); return true;
}

export function getEquipment() { return state.equipment.map(i => ({ ...i })); }

// Kimlik (debug/UI için)
export function getPlayerIdForUI() { return getPlayerId(); }
