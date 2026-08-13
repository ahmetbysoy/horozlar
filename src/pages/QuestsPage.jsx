import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import { addCoins, spendCoins } from '../store/gameStore.js';
import { useToast } from '../components/common/Toast.jsx';
import { GeneticsEngine } from '../engine/GeneticsEngine.js';

const DAILY = [
  { id: 'fight2', label: '⚔️ 2 dövüş kazan', target: 2, reward: 200 },
  { id: 'train3', label: '🏋️ 3 antrenman yap', target: 3, reward: 100 },
];

const WEEKLY = [
  { id: 'win15', label: '⚔️ 15 dövüş kazan', target: 15, reward: 1000 },
  { id: 'earn', label: '💰 Coin biriktir', target: 5000, reward: 500 },
];

export default function QuestsPage() {
  const state = useGame();
  const toast = useToast();
  const [tab, setTab] = useState('daily');

  const fights = state.wins;
  const coinEarned = state.coins;
  const [claimed, setClaimed] = useState([]);

  const claim = (q) => {
    if (claimed.includes(q.id)) return toast('Zaten aldın');
    addCoins(q.reward);
    setClaimed(c => [...c, q.id]);
    toast(`💰 ${q.reward} coin kazandın!`);
  };

  const quests = tab === 'daily' ? DAILY : WEEKLY;

  return (
    <div>
      <h1>📋 Görevler</h1>
      <div className="seg">
        <button className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>Günlük</button>
        <button className={tab === 'weekly' ? 'active' : ''} onClick={() => setTab('weekly')}>Haftalık</button>
      </div>

      {quests.map(q => {
        const progress = q.id === 'fight2' || q.id === 'win15' ? fights : coinEarned;
        const done = progress >= q.target;
        const pct = Math.min(100, (progress / q.target) * 100);
        const isClaimed = claimed.includes(q.id);
        return (
          <div key={q.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{q.label}</div>
                <div className="muted" style={{ fontSize: 12 }}>{Math.min(progress, q.target)}/{q.target}</div>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--accent-yellow)' }}>🪙 {q.reward}</span>
            </div>
            <div className="stat-bar mt"><div className="stat-fill" style={{ width: `${pct}%`, background: 'var(--accent-green)' }} /></div>
            {done && (
              <button className="btn btn-green btn-sm btn-block mt" disabled={isClaimed} onClick={() => claim(q)}>
                {isClaimed ? '✅ Alındı' : '💰 Ödül Al'}
              </button>
            )}
          </div>
        );
      })}

      <div className="glass mt">
        <h2 style={{ fontSize: 15 }}>İstatistiklerin</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 13 }}>
          <span>Dövüş: <b>{state.fights}</b></span>
          <span>Galibiyet: <b>{state.wins}</b></span>
          <span>Coin: <b>{state.coins}</b></span>
          <span>Horoz: <b>{state.roosters.length}</b></span>
        </div>
      </div>
    </div>
  );
}
