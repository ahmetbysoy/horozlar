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
  // Karaborsa takviyeleri (sahip olunanlar)
  takviyeler: [], // { id, name, slot(GEÇICI/KALICI), stat, value, ... }
  // Kanca (gaff) envanteri
  kancalar: [],
  // Onboarding / ayarlar
  onboarded: false,
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

export function completeOnboarding() {
  state.onboarded = true;
  commit();
}

// ---------- Günlük Çark (§6.23) ----------

// Çark segmentleri ve ağırlıkları (dokümandaki oranlarla)
export const WHEEL_SEGMENTS = [
  { label: '50 🪙',  type: 'coins', value: 50,   weight: 30 },
  { label: '100 🪙', type: 'coins', value: 100,  weight: 25 },
  { label: '250 🪙', type: 'coins', value: 250,  weight: 20 },
  { label: '500 🪙', type: 'coins', value: 500,  weight: 12 },
  { label: '1000 🪙',type: 'coins', value: 1000, weight: 8 },
  { label: '1 💎',   type: 'diamonds', value: 1, weight: 4 },
  { label: 'RARE 🐓',type: 'rooster', value: 0,  weight: 1 },
];

export const WHEEL_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4'];

// Ağırlıklı rastgele sonuç seç
export function spinWheelResult() {
  const total = WHEEL_SEGMENTS.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const seg of WHEEL_SEGMENTS) {
    if (roll < seg.weight) return seg;
    roll -= seg.weight;
  }
  return WHEEL_SEGMENTS[0];
}

// Çarkı çevir — günde 1 ücretsiz, ekstra 1 💎
export function spinWheel(useDiamond = false) {
  const today = new Date().toISOString().slice(0, 10);
  const already = state.lastSpinDate === today;
  if (already && !useDiamond) return { ok: false, freeUsed: true, msg: 'Bugün zaten çevirdin' };
  if (already && useDiamond) {
    if (state.diamonds < 1) return { ok: false, msg: '1 💎 gerekli' };
    state.diamonds -= 1;
  } else {
    state.lastSpinDate = today;
  }

  const seg = spinWheelResult();
  if (seg.type === 'coins') state.coins += seg.value;
  else if (seg.type === 'diamonds') state.diamonds += seg.value;
  else if (seg.type === 'rooster') {
    // RARE veya üstü bir horoz ver
    let r;
    do { r = GeneticsEngine.createRooster(); } while (r.rarity === 'COMMON');
    // Yadigar bonusu
    const rb = relicBonuses();
    r.stats.power += rb.power; r.stats.speed += rb.speed; r.stats.stamina += rb.stamina;
    r.stats.maxHealth = r.stats.stamina * 10 + rb.hp;
    r.hiddenStats.critChance = Math.min(0.25, r.hiddenStats.critChance + rb.crit);
    state.roosters.push(r);
    state.roosterSeed++;
    commit();
    return { ok: true, seg, rooster: r };
  }

  commit();
  return { ok: true, seg };
}

export function canSpinFree() {
  const today = new Date().toISOString().slice(0, 10);
  return state.lastSpinDate !== today;
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

// ---------- Karaborsa Takviyeleri ----------

// Sokak takviye kataloğu (hor1'in karaborsasından esinlenerek)
export const TAKVIYELER = [
  { id: 'adrenalin', name: '💉 Adrenalin İğnesi', desc: '+10 hız (1 maç)', slot: 'GECICI', stat: 'speed', value: 10, cost: 500, sokak: 'Bir çekti mi tozu, horoz uçar.' },
  { id: 'cig_et', name: '🥩 Çiğ Et', desc: '+5 güç (kalıcı)', slot: 'KALICI', stat: 'power', value: 5, cost: 2000, sokak: 'Bununla beslenen horoz yumruk gibi olur.' },
  { id: 'secere', name: '📜 Sahte Secere', desc: '+100 prestij (anında)', slot: 'ANINDA', stat: 'prestige', value: 100, cost: 1000, sokak: 'Mühürlü kâğıt, mahkemede kimse sormaz.' },
  { id: 'zehir_biber', name: '🌶️ Biber Gazı', desc: '+%10 kaçınma (1 maç)', slot: 'GECICI', stat: 'dodge', value: 0.10, cost: 800, sokak: 'Gözüne çekince kör olur düşman.' },
  { id: 'horoz_suyu', name: '🧃 Horoz Suyu', desc: '+20 can (1 maç)', slot: 'GECICI', stat: 'hp', value: 200, cost: 1200, sokak: 'Gizli karışım, tarifini kimse bilmez.' },
];

// Takviye al
export function buyTakviye(id) {
  const t = TAKVIYELER.find(x => x.id === id);
  if (!t) return { ok: false };
  if (state.coins < t.cost) return { ok: false, msg: 'Papelin yetmiyor koçum' };
  state.coins -= t.cost;
  state.takviyeler = state.takviyeler || [];
  state.takviyeler.push({ id: t.id, name: t.name, slot: t.slot, stat: t.stat, value: t.value, used: false });
  commit();
  return { ok: true, item: t };
}

// Takviyeleri kullan (ANINDA olanlar anında uygulanır, KALICI kalıcı uygulanır)
export function useTakviye(id) {
  const t = state.takviyeler.find(x => x.id === id && !x.used);
  const def = TAKVIYELER.find(x => x.id === id);
  if (!t || !def) return { ok: false };
  if (def.slot === 'ANINDA') {
    state.prestigePoints += def.value;
    t.used = true;
    commit();
    return { ok: true, msg: `+${def.value} prestij` };
  }
  if (def.slot === 'KALICI') {
    // Kullanıcı bir horoz seçer; burada ilk horoza uygulanır (UI'da seçtirilebilir)
    t.used = true;
    commit();
    return { ok: true, msg: 'Horoz seçmen gerekiyor' };
  }
  return { ok: false, msg: 'Geçici takviye dövüş öncesi kullanılır' };
}

// Kalıcı takviyeyi bir horoza uygula
export function applyKaliciTakviye(takviyeId, roosterId) {
  const t = state.takviyeler.find(x => x.id === takviyeId && !x.used);
  const def = TAKVIYELER.find(x => x.id === takviyeId);
  const r = state.roosters.find(x => x.id === roosterId);
  if (!t || !def || !r) return { ok: false };
  if (def.slot === 'KALICI') {
    r.stats[def.stat] = Math.min(150, r.stats[def.stat] + def.value);
    r.stats.maxHealth = r.stats.stamina * 10;
    t.used = true;
    commit();
    return { ok: true };
  }
  return { ok: false };
}

export function getTakviyeler() { return (state.takviyeler || []).map(t => ({ ...t })); }

// Dövüş öncesi geçici takviyeleri hesapla (activeTakviyeler array olarak dövüşe verilir)
export function applyGeciciTakviye(takviyeId, fighter) {
  const t = state.takviyeler.find(x => x.id === takviyeId && !x.used);
  const def = TAKVIYELER.find(x => x.id === takviyeId);
  if (!t || !def) return false;
  if (def.slot === 'GECICI') {
    fighter.stats[def.stat] += def.value;
    if (def.stat === 'hp') fighter.stats.maxHealth += def.value;
    t.used = true;
    commit();
    return true;
  }
  return false;
}

// ---------- Kanca (Gaff) Sistemi ----------

export const KANCALAR = [
  { id: 'kemik', name: '🪶 Kemik Kanca', dmgPct: 0.05, crit: 0, risk: 0, cost: 300 },
  { id: 'celik', name: '🔪 Çelik Kanca', dmgPct: 0.12, crit: 0, risk: 0, cost: 800 },
  { id: 'kartal', name: '🦅 Kartal Mahmuzu', dmgPct: 0.20, crit: 0.05, risk: 0, cost: 2000 },
  { id: 'kanli', name: '💀 Kanlı Mahmuz', dmgPct: 0.30, crit: 0, risk: 0.10, cost: 5000 },
];

export function buyKanca(id) {
  const k = KANCALAR.find(x => x.id === id);
  if (!k) return { ok: false };
  if (state.coins < k.cost) return { ok: false, msg: 'Papelin yetmiyor koçum' };
  state.coins -= k.cost;
  state.kancalar = state.kancalar || [];
  if (!state.kancalar.includes(id)) state.kancalar.push(id);
  commit();
  return { ok: true, item: k };
}

export function getKancalar() { return (state.kancalar || []).slice(); }

// Kimlik (debug/UI için)
export function getPlayerIdForUI() { return getPlayerId(); }
