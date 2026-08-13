import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import { claimDaily, refillEnergy } from '../store/gameStore.js';
import { useToast } from '../components/common/Toast.jsx';
import StatBar from '../components/common/StatBar.jsx';
import { GeneticsEngine } from '../engine/GeneticsEngine.js';

export default function HomePage({ onNavigate }) {
  const state = useGame();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const claimed = state.lastDailyClaim === today;
  const levelPct = state.xp / (100 * state.level);

  const claim = () => {
    if (claimDaily()) toast('🪙 Günlük ödül alındı! +200 coin & ⚡ enerji doldu');
    else toast('Bugün zaten aldınız');
  };

  const bestRooster = [...state.roosters].sort((a, b) => GeneticsEngine.totalStats(b) - GeneticsEngine.totalStats(a))[0];

  return (
    <div>
      <div className="glass mb" style={{ textAlign: 'center' }}>
        <h1>🐓 Hoş geldin, Çiftçi!</h1>
        <div className="muted">Horozlarını yetiştir, dövüştür ve imparatorluğunu kur!</div>
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
      </div>

      <div className="glass mt" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        <b>Nasıl oynanır?</b> Horozlarını üret, antrenman yap, arenada dövüş, pazar'dan güçlen. Dövüş kazandıkça coin ve XP kazanırsın.
      </div>
    </div>
  );
}
