import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import { claimDaily, refillEnergy, prestigeReset, buyRelic, RELICS } from '../store/gameStore.js';
import { useToast } from '../components/common/Toast.jsx';
import StatBar from '../components/common/StatBar.jsx';
import Modal from '../components/common/Modal.jsx';
import { GeneticsEngine } from '../engine/GeneticsEngine.js';
import { seasonInfo, SEASON_QUESTS, formatDuration } from '../engine/SeasonEngine.js';
import { audio } from '../managers/AudioManager.js';
import { vibrate } from '../utils/vibrate.js';
import { TelegramService } from '../config/telegram.js';

export default function HomePage({ onNavigate }) {
  const state = useGame();
  const toast = useToast();
  const tgUser = TelegramService.getUser();
  const today = new Date().toISOString().slice(0, 10);
  const claimed = state.lastDailyClaim === today;
  const levelPct = state.xp / (100 * state.level);

  const claim = () => {
    if (claimDaily()) { audio.win(); vibrate('success'); toast('🪙 Günlük ödül alındı! +200 coin & ⚡ enerji doldu'); }
    else toast('Bugün zaten aldınız');
  };

  const bestRooster = [...state.roosters].sort((a, b) => GeneticsEngine.totalStats(b) - GeneticsEngine.totalStats(a))[0];
  const [showPrestige, setShowPrestige] = useState(false);
  const [showSeason, setShowSeason] = useState(false);
  const [showRelics, setShowRelics] = useState(false);
  const season = seasonInfo();

  const doPrestige = () => {
    const res = prestigeReset();
    if (res.ok) { audio.win(); vibrate('success'); setShowPrestige(false); toast(`⭐ Prestij! +${res.mpGain} Miras Puanı (Toplam: ${res.prestigeCount})`); }
    else toast(res.message);
  };

  return (
    <div>
      <div className="glass mb" style={{ textAlign: 'center' }}>
        <h1>🐓 Hoş geldin{tgUser ? `, ${tgUser.firstName}` : ', Çiftçi'}!</h1>
        <div className="muted">Horozlarını yetiştir, dövüştür ve imparatorluğunu kur!</div>
        {tgUser && (
          <div className="mt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {tgUser.photoUrl && <img src={tgUser.photoUrl} alt="avatar" style={{ width: 34, height: 34, borderRadius: '50%' }} />}
            <span className="muted" style={{ fontSize: 12 }}>@{tgUser.username || 'Telegram kullanıcısı'}{tgUser.isPremium && ' 👑'}</span>
          </div>
        )}
        {!tgUser && <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>ℹ️ Telegram içinden açarsan kullanıcı bilgin ve özel tema otomatik yüklenir.</div>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Seviye {state.level}</h2>
          <span className="muted">{state.xp}/{100 * state.level} XP</span>
        </div>
        <StatBar label="" value={state.xp} max={100 * state.level} color="var(--accent-purple)" />
        <div className="mt" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-green btn-sm" onClick={claim} disabled={claimed}>{claimed ? '✅ Alındı' : '🎁 Günlük Ödül'}</button>
          <button className="btn btn-blue btn-sm" onClick={() => { refillEnergy(); toast('⚡ Enerji dolduruldu (geliştirme modu)'); }}>⚡ Enerji Doldur</button>
        </div>
      </div>

      {bestRooster && (
        <div className="card">
          <h2>🏆 En Güçlü Horozun</h2>
          <div className="muted">{bestRooster.name} · Toplam {GeneticsEngine.totalStats(bestRooster)}</div>
          <button className="btn btn-primary btn-block mt" onClick={() => onNavigate('combat')}>⚔️ Savaşa Git</button>
        </div>
      )}

      <div className="grid grid-2">
        <button className="btn btn-green" onClick={() => onNavigate('roosters')}>🐓 Horozlarım ({state.roosters.length})</button>
        <button className="btn btn-gold" onClick={() => onNavigate('market')}>🛒 Pazar</button>
        <button className="btn btn-purple" onClick={() => onNavigate('quests')}>📋 Görevler</button>
        <button className="btn btn-blue" onClick={() => onNavigate('combat')}>⚔️ Arena</button>
        <button className="btn btn-secondary" onClick={() => onNavigate('clan')}>🏰 Klan</button>
        <button className="btn btn-secondary" onClick={() => setShowSeason(true)}>📅 Sezon {season.number}</button>
      </div>

      {/* Prestij kartı */}
      <div className="card mt">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>⭐ Prestij</h2>
          <span className="muted" style={{ fontSize: 13 }}>Miras: 👑 {state.mirasPoints}</span>
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Prestij Puanı: {state.prestigePoints} / 5000 · Sıfırlama: {state.prestigeCount} kez</div>
        <div className="stat-bar mt"><div className="stat-fill" style={{ width: `${Math.min(100, state.prestigePoints / 50)}%`, background: 'var(--accent-yellow)' }} /></div>
        <div className="mt" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gold btn-sm" style={{ flex: 1 }} disabled={state.prestigePoints < 5000} onClick={() => setShowPrestige(true)}>
            {state.prestigePoints >= 5000 ? '⭐ Prestij Sıfırla' : '5000 gerekli'}
          </button>
          <button className="btn btn-purple btn-sm" style={{ flex: 1 }} onClick={() => setShowRelics(true)}>👑 Yadigarlar</button>
        </div>
      </div>

      {/* Prestij modal */}
      {showPrestige && (
        <Modal title="⭐ Prestij Sıfırla" onClose={() => setShowPrestige(false)}>
          <p>5000 prestij puanını harcayarak <b>{(state.prestigePoints / 100) | 0} Miras Puanı</b> kazanacaksın. Tüm horozların ve coinlerin sıfırlanır, elmasların ve yadigarların korunur.</p>
          <button className="btn btn-gold btn-block" onClick={doPrestige}>⭐ Onayla</button>
          <button className="btn btn-secondary btn-block mt" onClick={() => setShowPrestige(false)}>Vazgeç</button>
        </Modal>
      )}

      {/* Yadigar modal */}
      {showRelics && (
        <Modal title="👑 Yadigarlar (Miras Puanı ile)" onClose={() => setShowRelics(false)}>
          <p className="muted" style={{ fontSize: 13 }}>Miras Puanın: <b style={{ color: 'var(--accent-yellow)' }}>{state.mirasPoints}</b></p>
          {RELICS.map(r => {
            const owned = state.yadigarlar.includes(r.id);
            return (
              <div key={r.id} className="card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: owned ? '1px solid #22c55e' : undefined }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{r.desc}</div>
                </div>
                <button className="btn btn-sm btn-purple" disabled={owned || state.mirasPoints < r.cost} onClick={() => { buyRelic(r.id); toast(`👑 ${r.name} alındı!`); }}>
                  {owned ? '✅' : `👑 ${r.cost}`}
                </button>
              </div>
            );
          })}
        </Modal>
      )}

      {/* Sezon modal */}
      {showSeason && (
        <Modal title={`📅 Sezon ${season.number}`} onClose={() => setShowSeason(false)}>
          <p className="muted" style={{ fontSize: 13 }}>Sezon bitişine: <b>{season.daysLeft} gün</b> · Sezon XP: {state.seasonXp}</p>
          {SEASON_QUESTS.map(q => {
            const done = state.seasonXp >= q.target;
            return (
              <div key={q.id} className="card" style={{ padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>{q.label}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{Math.min(state.seasonXp, q.target)}/{q.target}</span>
                </div>
                <div className="stat-bar mt"><div className="stat-fill" style={{ width: `${Math.min(100, (state.seasonXp / q.target) * 100)}%`, background: 'var(--accent-purple)' }} /></div>
                {done && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>✅ Ödül: 🪙{q.rewardCoins} {q.rewardDiamonds > 0 && `+ 💎${q.rewardDiamonds}`}</div>}
              </div>
            );
          })}
        </Modal>
      )}

      <div className="glass mt" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        <b>Nasıl oynanır?</b> Horozlarını üret, antrenman yap, arenada dövüş, pazar'dan güçlen. Dövüş kazandıkça coin ve XP kazanırsın.
      </div>
    </div>
  );
}
