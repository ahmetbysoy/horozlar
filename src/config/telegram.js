// ============================================================
// TELEGRAM WEBAPP SERVICE — Doküman §5
// Tarayıcıda (Telegram dışı) çalışırken zarifçe düşer.
// ============================================================

const getTg = () => {
  try { return window?.Telegram?.WebApp; } catch { return null; }
};

export const TelegramService = {
  isAvailable: () => !!getTg(),

  init() {
    const tg = getTg();
    if (!tg) return;
    try {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();
    } catch (e) { /* ignore */ }
  },

  getUser() {
    const tg = getTg();
    if (!tg?.initDataUnsafe?.user) return null;
    const u = tg.initDataUnsafe.user;
    return {
      id: String(u.id),
      firstName: u.first_name,
      lastName: u.last_name || '',
      username: u.username || '',
      languageCode: u.language_code || 'tr',
      photoUrl: u.photo_url || '',
      isPremium: u.is_premium || false,
    };
  },

  getTheme() {
    const tg = getTg();
    const p = tg?.themeParams || {};
    return {
      colorScheme: tg?.colorScheme || 'dark',
      bgColor: p.bg_color || '#0f0f23',
      textColor: p.text_color || '#e2e8f0',
      hintColor: p.hint_color || '#94a3b8',
      buttonColor: p.button_color || '#ef4444',
      buttonTextColor: p.button_text_color || '#ffffff',
      secondaryBgColor: p.secondary_bg_color || '#16213e',
    };
  },

  haptic: {
    impact: (style = 'medium') => getTg()?.HapticFeedback?.impactOccurred(style),
    notification: (type = 'success') => getTg()?.HapticFeedback?.notificationOccurred(type),
    selection: () => getTg()?.HapticFeedback?.selectionChanged(),
  },

  showMainButton(text, onClick) {
    const tg = getTg();
    if (!tg) return;
    tg.MainButton.setText(text);
    tg.MainButton.onClick(onClick);
    tg.MainButton.show();
  },
  hideMainButton() { getTg()?.MainButton?.hide(); },

  showBackButton(onClick) {
    const tg = getTg();
    if (!tg) return;
    tg.BackButton.onClick(onClick);
    tg.BackButton.show();
  },
  hideBackButton() { getTg()?.BackButton?.hide(); },

  showPopup(params) {
    const tg = getTg();
    if (!tg) return Promise.resolve();
    return new Promise((resolve) => { tg.showPopup(params, resolve); });
  },

  shareUrl(url, text) {
    getTg()?.openTelegramLink?.(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
  },

  setHeaderColor(color) {
    const tg = getTg();
    if (tg && tg.setHeaderColor) tg.setHeaderColor(color);
  },
};
