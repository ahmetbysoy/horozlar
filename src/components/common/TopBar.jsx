import { useState } from 'react';
import { audio } from '../../managers/AudioManager.js';
import { TelegramService } from '../../config/telegram.js';

export default function TopBar({ state }) {
  const [sound, setSound] = useState(true);
  const tgUser = TelegramService.getUser();
  return (
    <div className="topbar">
      <div className="brand">
        🐓 Horoz<span>İmp</span>
        {tgUser && <span className="badge" style={{ background: '#3b82f622', color: '#3b82f6', marginLeft: 6, fontSize: 10 }}>TG</span>}
      </div>
      <div className="resources">
        <span className="res coin">🪙 {fmt(state.coins)}</span>
        <span className="res diamond">💎 {state.diamonds}</span>
        <span className="res energy">⚡ {state.energy}/{state.energyMax}</span>
        <button
          className="nav-item"
          style={{ padding: 0, width: 26, height: 26, fontSize: 15 }}
          onClick={() => { const on = audio.toggle(); setSound(on); }}
          title={sound ? 'Sesi kapat' : 'Sesi aç'}
        >{sound ? '🔊' : '🔇'}</button>
      </div>
    </div>
  );
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
}
