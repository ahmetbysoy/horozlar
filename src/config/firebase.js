// ============================================================
// FIREBASE REALTIME DATABASE istemcisi — REST API üzerinden
// Veriler "/horoz/" isim alanı altında tutulur (mevcut "balvakti"
// oyununun verisine dokunmaz). Firebase SDK gerektirmez.
// ============================================================

const DB_URL = 'https://liqidasyon-default-rtdb.europe-west1.firebasedatabase.app';
const NAMESPACE = 'horoz';

// Oyuncu kimliği: Telegram kullanıcı id'si varsa onu, yoksa kalıcı cihaz id'si kullan
export function getPlayerId() {
  try {
    const tg = window?.Telegram?.WebApp;
    const uid = tg?.initDataUnsafe?.user?.id;
    if (uid) return 'tg_' + String(uid);
  } catch (e) { /* ignore */ }
  let id = localStorage.getItem('horoz-device-id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem('horoz-device-id', id);
  }
  return id;
}

export const fdb = {
  url: DB_URL,

  // Ana veri yolu: /horoz/v1/{playerId}
  path(playerId) {
    return `${NAMESPACE}/v1/${encodeURIComponent(playerId)}`;
  },

  // Klanlar (ortak/global alan, oyuncudan ayrı): /horoz/clans/{clanId}
  clanPath(clanId) {
    return `${NAMESPACE}/clans/${encodeURIComponent(clanId)}`;
  },

  // Global liderlik / meta: /horoz/meta/{key}
  metaPath(key) {
    return `${NAMESPACE}/meta/${encodeURIComponent(key)}`;
  },

  async get(path) {
    const res = await fetch(`${DB_URL}/${path}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('RTDB okuma hatası: ' + res.status);
    return res.json();
  },

  async set(path, value) {
    const res = await fetch(`${DB_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value ?? null),
    });
    if (!res.ok) throw new Error('RTDB yazma hatası: ' + res.status);
    return res.json();
  },

  async push(path, value) {
    const res = await fetch(`${DB_URL}/${path}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error('RTDB push hatası: ' + res.status);
    const d = await res.json();
    return d.name;
  },

  // Oyuncuya özel yardımcılar
  async getPlayer(key, playerId = getPlayerId()) { return this.get(`${this.path(playerId)}/${key}`); },
  async setPlayer(key, value, playerId = getPlayerId()) { return this.set(`${this.path(playerId)}/${key}`, value); },
  async pushPlayer(key, value, playerId = getPlayerId()) { return this.push(`${this.path(playerId)}/${key}`, value); },
};

// Basit kalıcı kimlik (device fallback) kullanımı dışında kimlik gösterim yardımcıları
export function isTelegramUser() {
  try { return !!window?.Telegram?.WebApp?.initDataUnsafe?.user?.id; } catch { return false; }
}
