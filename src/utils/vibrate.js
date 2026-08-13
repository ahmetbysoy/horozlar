// ============================================================
// VIBRATION / HAPTIC — Telegram HapticFeedback + Web fallback
// Doküman §8.3
// ============================================================

export function vibrate(pattern = 'medium') {
  try {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(pattern)) {
        tg.HapticFeedback.impactOccurred(pattern);
      } else if (['success', 'error', 'warning'].includes(pattern)) {
        tg.HapticFeedback.notificationOccurred(pattern);
      }
      return;
    }
  } catch (e) { /* ignore */ }

  if (navigator.vibrate) {
    const patterns = {
      light: [8], medium: [20], heavy: [40],
      success: [10, 30, 10], error: [30, 10, 30], warning: [20, 20, 20],
    };
    navigator.vibrate(patterns[pattern] || [20]);
  }
}
