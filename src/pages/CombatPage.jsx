import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import RoosterCanvas from '../components/rooster/RoosterCanvas.jsx';
import FightScene from '../components/combat/FightScene.jsx';
import { createAI } from '../engine/AIGenerator.js';
import { spendEnergy, recordFight, addCoins, addDiamonds, addXp, updateRooster } from '../store/gameStore.js';
import { useToast } from '../components/common/Toast.jsx';
import { GeneticsEngine } from '../engine/GeneticsEngine.js';

const LEAGUES = [
  { id: 'SOKAK', name: '🏚️ Sokak', reward: [100, 200], tier: 0 },
  { id: 'MAHALLE', name: '🏘️ Mahalle', reward: [200, 350], tier: 1 },
  { id: 'SEHIR', name: '🏙️ Şehir', reward: [300, 500], tier: 2 },
  { id: 'YERALTI', name: '🕳️ Yeraltı', reward: [500, 800], tier: 3 },
  { id: 'KARA', name: '💀 Kara Arena', reward: [800, 1500], tier: 4 },
];

export default function CombatPage() {
  const state = useGame();
  const toast = useToast();
  const [step, setStep] = useState('select'); // select | arena | fight | result
  const [selectedRooster, setSelectedRooster] = useState(null);
  const [league, setLeague] = useState(LEAGUES[0]);
  const [enemy, setEnemy] = useState(null);
  const [auto, setAuto] = useState(true);
  const [outcome, setOutcome] = useState(null);

  const startFight = () => {
    if (!selectedRooster) return toast('Önce bir horoz seç');
    if (state.energy < 10) return toast('⚠️ Yeterli enerji yok (10 ⚡)');
    spendEnergy(10);
    const ai = createAI(league.tier);
    setEnemy(ai);
    setOutcome(null);
    setStep('fight');
  };

  const onFinish = (res) => {
    const [min, max] = league.reward;
    const coinReward = min + Math.floor(Math.random() * (max - min));
    let diamonds = 0;
    if (res.win) { if (Math.random() < 0.1) diamonds = 1; }
    setOutcome({
      win: res.win,
      coin: res.win ? coinReward : Math.floor(coinReward * 0.25),
      diamonds,
      enemyName: res.enemyRooster?.name || enemy?.name,
      roosterId: selectedRooster.id,
    });
    // Kayıt
    if (res.win) {
      addCoins(coinReward);
      addXp(25);
      if (diamonds) addDiamonds(diamonds);
    } else {
      addCoins(Math.floor(coinReward * 0.25));
      addXp(5);
    }
    recordFight(selectedRooster.id, res.win);
    // %30 gizli keşif
    const r = state.roosters.find(x => x.id === selectedRooster.id);
    if (r) {
      const undiscovered = ['critChanceRevealed', 'dodgeChanceRevealed', 'lateGameRevealed'].filter(k => !r.discovered[k]);
      if (undiscovered.length && Math.random() < 0.3) {
        const key = undiscovered[Math.floor(Math.random() * undiscovered.length)];
        updateRooster(r.id, { discovered: { ...r.discovered, [key]: true } });
        setTimeout(() => toast('🔍 Gizli özellik keşfedildi!'), 300);
      }
    }
    setStep('result');
  };

  const reset = () => { setStep('select'); setSelectedRooster(null); setEnemy(null); };

  // Adım 1: horoz seç
  if (step === 'select') {
    return (
      <div>
        <h1>⚔️ Arena</h1>
        <p className="muted mb">Dövüşecek horozunu seç</p>
        <div className="grid grid-roosters">
          {state.roosters.map(r => (
            <div key={r.id} className={`card rooster-card ${selectedRooster?.id === r.id ? 'selected' : ''}`}
              style={selectedRooster?.id === r.id ? { border: '2px solid var(--accent-yellow)' } : {}}
              onClick={() => setSelectedRooster(r)}>
              <div className="center"><RoosterCanvas rooster={r} size={90} /></div>
              <div className="center" style={{ fontWeight: 700 }}>{r.name}</div>
              <div className="muted center" style={{ fontSize: 11 }}>Toplam {GeneticsEngine.totalStats(r)}</div>
            </div>
          ))}
        </div>
        {selectedRooster && <button className="btn btn-primary btn-block mt" onClick={() => setStep('arena')}>Devam → Arena Seç</button>}
      </div>
    );
  }

  // Adım 2: lig seç
  if (step === 'arena') {
    return (
      <div>
        <h1>⚔️ Lig Seç</h1>
        <button className="btn btn-secondary btn-sm mb" onClick={() => setStep('select')}>← Geri</button>
        {LEAGUES.map(l => (
          <div key={l.id} className={`card rooster-card`} onClick={() => { setLeague(l); startFight(); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800 }}>{l.name}</span>
              <span className="muted" style={{ fontSize: 12 }}>🪙 {l.reward[0]}-{l.reward[1]}</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>Rakip gücü: {'⭐'.repeat(l.tier + 1)} · ⚡10 enerji</div>
          </div>
        ))}
        <div className="glass mt" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14 }}>Dövüş modu</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setAuto(!auto)}>{auto ? '⚡ Otomatik' : '👆 Manuel'}</button>
        </div>
      </div>
    );
  }

  // Adım 3: dövüş
  if (step === 'fight' && enemy) {
    return (
      <div>
        <FightScene playerRooster={selectedRooster} enemyRooster={enemy} auto={auto} onFinish={onFinish} />
      </div>
    );
  }

  // Adım 4: sonuç
  if (step === 'result' && outcome) {
    return (
      <div className="glass center" style={{ marginTop: 40 }}>
        <div style={{ fontSize: 48 }}>{outcome.win ? '🏆' : '💀'}</div>
        <h1>{outcome.win ? 'KAZANDIN!' : 'KAYBETTİN'}</h1>
        <p className="muted">Rakip: {outcome.enemyName}</p>
        <div className="mt" style={{ fontSize: 16 }}>
          <div>🪙 +{outcome.coin}</div>
          {outcome.diamonds > 0 && <div>💎 +{outcome.diamonds}</div>}
          <div className="muted">+XP</div>
        </div>
        <div className="mt" style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          <button className="btn btn-primary btn-block" onClick={() => { reset(); }}>⚔️ Yeni Dövüş</button>
          <button className="btn btn-secondary btn-block" onClick={() => setStep('select')}>🐓 Horoz Değiştir</button>
        </div>
      </div>
    );
  }

  return null;
}
