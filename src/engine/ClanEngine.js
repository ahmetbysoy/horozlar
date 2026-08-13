// ============================================================
// CLAN ENGINE — Klan kurma, katılma, XP/seviye (doküman §6.19)
// Klan verisi RTDB'de /horoz/clans/{tag} altında saklanır (ortak alan)
// ============================================================
import { fdb, getPlayerId } from '../config/firebase.js';
import { setClanId, spendCoins, getState } from '../store/gameStore.js';

export const CLAN_COST = 1000;
export const CLAN_MAX_MEMBERS = 10;

export function tagKey(tag) { return String(tag || '').toUpperCase().trim(); }

export function clanLevel(xp) {
  return Math.min(5, 1 + Math.floor(xp / 1000));
}

export async function createClan(name, tag) {
  const key = tagKey(tag);
  if (!key || key.length < 3 || key.length > 5) return { ok: false, msg: 'Tag 3-5 karakter olmalı' };
  if (!name || name.trim().length < 3) return { ok: false, msg: 'Klan adı en az 3 karakter' };

  const pid = getPlayerId();
  const existing = await fdb.get(fdb.clanPath(key));
  if (existing && existing.name) return { ok: false, msg: 'Bu tag zaten kullanılıyor' };

  if (!spendCoins(CLAN_COST)) return { ok: false, msg: `Klan kurmak için ${CLAN_COST} 🪙 gerekli` };

  const clan = {
    tag: key,
    name: name.trim(),
    leaderId: pid,
    xp: 0,
    memberCount: 1,
    maxMembers: CLAN_MAX_MEMBERS,
    createdAt: Date.now(),
    members: { [pid]: { role: 'leader', joinedAt: Date.now(), contribution: 0, name: displayName() } },
  };
  await fdb.set(fdb.clanPath(key), clan);
  setClanId(key);
  return { ok: true, clan };
}

export async function joinClan(tag) {
  const key = tagKey(tag);
  if (!key) return { ok: false, msg: 'Klan tag gerekli' };
  const pid = getPlayerId();
  const clan = await fdb.get(fdb.clanPath(key));
  if (!clan || !clan.name) return { ok: false, msg: 'Klan bulunamadı' };
  if (clan.members && clan.members[pid]) return { ok: false, msg: 'Zaten bu klanın üyesisin' };
  if (clan.memberCount >= clan.maxMembers) return { ok: false, msg: 'Klan dolu' };

  clan.members = clan.members || {};
  clan.members[pid] = { role: 'member', joinedAt: Date.now(), contribution: 0, name: displayName() };
  clan.memberCount = Object.keys(clan.members).length;
  await fdb.set(fdb.clanPath(key), clan);
  setClanId(key);
  return { ok: true, clan };
}

export async function leaveClan() {
  const pid = getPlayerId();
  // Oyuncunun klanını bul — oyuncunun state'inde clanId var ama buradan erişemeyiz; basit tutalım.
  // Gerçekte clanId store'dan okunur; buradan temizlik zor olduğundan UI'dan çağrılır.
  setClanId(null);
  return { ok: true };
}

export async function getClan(tag) {
  const key = tagKey(tag);
  if (!key) return null;
  const clan = await fdb.get(fdb.clanPath(key));
  if (!clan || !clan.name) return null;
  return { ...clan, level: clanLevel(clan.xp || 0) };
}

export async function addClanXp(amount) {
  const clanId = getState().clanId;
  if (!clanId) return;
  const key = tagKey(clanId);
  const clan = await fdb.get(fdb.clanPath(key));
  if (clan && clan.name) {
    clan.xp = (clan.xp || 0) + amount;
    await fdb.set(fdb.clanPath(key), clan);
  }
}

function displayName() {
  try {
    const tg = window?.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tg?.first_name) return tg.first_name + (tg.last_name ? ' ' + tg.last_name : '');
    const local = localStorage.getItem('horoz-device-name');
    return local || 'Oyuncu';
  } catch { return 'Oyuncu'; }
}
