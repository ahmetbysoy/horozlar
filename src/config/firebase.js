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

  async get(key, playerId = getPlayerId()) {
    const res = await fetch(`${DB_URL}/${this.path(playerId)}/${key}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('RTDB okuma hatası: ' + res.status);
    return res.json();
  },

  async set(key, value, playerId = getPlayerId()) {
    const res = await fetch(`${DB_URL}/${this.path(playerId)}/${key}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value ?? null),
    });
    if (!res.ok) throw new Error('RTDB yazma hatası: ' + res.status);
    return res.json();
  },

  async push(key, value, playerId = getPlayerId()) {
    const res = await fetch(`${DB_URL}/${this.path(playerId)}/${key}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    if (!res.ok) throw new Error('RTDB push hatası: ' + res.status);
    const d = await res.json();
    return d.name;
  },
};

// Basit kalıcı kimlik (device fallback) kullanımı dışında kimlik gösterim yardımcıları
export function isTelegramUser() {
  try { return !!window?.Telegram?.WebApp?.initDataUnsafe?.user?.id; } catch { return false; }
}
