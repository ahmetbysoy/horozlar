import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import { useToast } from '../components/common/Toast.jsx';
import Modal from '../components/common/Modal.jsx';
import { startNewGame, getPlayerIdForUI, getPrestige, getSeason } from '../store/gameStore.js';
import { audio } from '../managers/AudioManager.js';
import { vibrate } from '../utils/vibrate.js';
import { TelegramService } from '../config/telegram.js';

export default function ProfilePage({ onNavigate }) {
  const state = useGame();
  const toast = useToast();
  const tgUser = TelegramService.getUser();
  const prestige = getPrestige();
  const season = getSeason();
  const [confirmReset, setConfirmReset] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const playerId = getPlayerIdForUI();
  const isTG = playerId.startsWith('tg_');

  const winRate = state.fights > 0 ? Math.round((state.wins / state.fights) * 100) : 0;
  const totalStats = state.roosters.reduce((s, r) => s + (r.stats.power + r.stats.speed + r.stats.stamina), 0);

  const doReset = () => {
    startNewGame();
    setConfirmReset(false);
    audio.win();
    toast('🔄 Yeni oyun başlatıldı');
    setTimeout(() => onNavigate('home'), 300);
  };

  const stats = [
    { label: 'Dövüş', value: state.fights, icon: '⚔️' },
    { label: 'Galibiyet', value: state.wins, icon: '🏆' },
    { label: 'Kazanma Oranı', value: `%${winRate}`, icon: '📊' },
    { label: 'Horoz', value: state.roosters.length, icon: '🐓' },
    { label: 'Toplam Güç', value: totalStats, icon: '💪' },
    { label: 'Prestij', value: state.prestigePoints, icon: '⭐' },
    { label: 'Miras', value: prestige.mirasPoints, icon: '👑' },
    { label: 'Seviye', value: state.level, icon: '🚀' },
  ];

  return (
    <div>
      {/* Profil başlığı */}
      <div className="glass center mb">
        {tgUser?.photoUrl ? (
          <img src={tgUser.photoUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 10px', display: 'block', border: '3px solid var(--accent-yellow)' }} />
        ) : (
          <div style={{ fontSize: 56 }}>🐓</div>
        )}
        <h1 style={{ margin: '0 0 4px' }}>
          {tgUser ? `${tgUser.firstName}${tgUser.lastName ? ' ' + tgUser.lastName : ''}` : 'Çiftçi'}{tgUser?.isPremium && ' 👑'}
        </h1>
        <div className="muted" style={{ fontSize: 13 }}>
          {isTG ? (tgUser?.username ? `@${tgUser.username}` : 'Telegram oyuncusu') : 'Cihaz oyuncusu'} · Seviye {state.level}
        </div>
        {state.clanId && <span className="badge mt" style={{ background: '#f59e0b22', color: '#f59e0b', display: 'inline-block', marginTop: 6 }}>🏰 {state.clanId}</span>}
      </div>

      {/* Sezon ilerleme */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>📅 Sezon XP</h2>
          <span className="muted" style={{ fontSize: 13 }}>{season.seasonXp}</span>
        </div>
        <div className="stat-bar"><div className="stat-fill" style={{ width: `${Math.min(100, (state.xp / (100 * state.level)) * 100)}%`, background: 'var(--accent-purple)' }} /></div>
        <div className="muted mt" style={{ fontSize: 12 }}>Seviye {state.level} · {state.xp}/{100 * state.level} XP</div>
      </div>

      {/* İstatistik ızgarası */}
      <h2 style={{ fontSize: 17 }}>📊 İstatistikler</h2>
      <div className="grid grid-2">
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: 12, marginBottom: 0 }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
            <div className="muted" style={{ fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Hızlı erişim */}
      <div className="glass mt">
        <h2 style={{ fontSize: 16 }}>Hızlı Erişim</h2>
        <div className="grid grid-2 mt">
          <button className="btn btn-green" onClick={() => onNavigate('roosters')}>🐓 Horozlarım</button>
          <button className="btn btn-blue" onClick={() => onNavigate('combat')}>⚔️ Dövüş</button>
          <button className="btn btn-gold" onClick={() => onNavigate('market')}>🛒 Pazar</button>
          <button className="btn btn-purple" onClick={() => onNavigate('quests')}>📋 Görevler</button>
        </div>
      </div>

      {/* Ayarlar */}
      <button className="btn btn-secondary btn-block mt" onClick={() => setShowSettings(true)}>⚙️ Ayarlar</button>

      {/* Ayarlar modal */}
      {showSettings && (
        <Modal title="⚙️ Ayarlar" onClose={() => setShowSettings(false)}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
            <span>🔊 Ses efektleri</span>
            <button className="btn btn-sm btn-secondary" onClick={() => { const on = audio.toggle(); setSoundOn(on); }}>
              {soundOn ? 'Açık' : 'Kapalı'}
            </button>
          </div>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
            <span>📳 Titreşim</span>
            <button className="btn btn-sm btn-secondary" onClick={() => { vibrate('light'); toast('📳 Titreşim aktif (deneme)'); }}>Test Et</button>
          </div>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
            <span>🪙 Para birimi</span>
            <span className="muted">Coin / Elmas</span>
          </div>
          <button className="btn btn-gold btn-block" onClick={() => setConfirmReset(true)}>🔄 Yeni Oyun Başlat</button>
          <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Yeni oyun tüm horozlarını ve kaydını sıfırlar. Buluttaki kaydın da temizlenir.</div>
        </Modal>
      )}

      {/* Sıfırlama onayı */}
      {confirmReset && (
        <Modal title="⚠️ Emin misin?" onClose={() => setConfirmReset(false)}>
          <p>Bu işlem geri alınamaz. Tüm horozların, coinlerin ve ilerlemen silinecek.</p>
          <button className="btn btn-primary btn-block" onClick={doReset}>🔄 Evet, Sıfırla</button>
          <button className="btn btn-secondary btn-block mt" onClick={() => setConfirmReset(false)}>Vazgeç</button>
        </Modal>
      )}
    </div>
  );
}
