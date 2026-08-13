import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import { generateRooster, spendCoins, spendEnergy, updateRooster, removeRooster } from '../store/gameStore.js';
import RoosterCard from '../components/rooster/RoosterCard.jsx';
import RoosterDetail from '../components/rooster/RoosterDetail.jsx';
import { useToast } from '../components/common/Toast.jsx';
import Modal from '../components/common/Modal.jsx';
import { GeneticsEngine } from '../engine/GeneticsEngine.js';

export default function RoostersPage() {
  const state = useGame();
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const [showTrain, setShowTrain] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');

  const addRooster = () => {
    const r = generateRooster(name.trim() || null);
    setShowNew(false);
    setName('');
    toast(`🐓 ${r.name} doğdu! (${r.rarity})`);
  };

  const train = (roosterId, stat) => {
    if (state.energy < 10) return toast('⚠️ Yeterli enerji yok (10 ⚡)');
    if (state.coins < 100) return toast('⚠️ Yeterli coin yok (100 🪙)');
    spendEnergy(10);
    spendCoins(100);
    const r = state.roosters.find(x => x.id === roosterId);
    const gain = 1 + Math.floor(Math.random() * 3);
    const newVal = Math.min(r.stats.potential, r.stats[stat] + gain);
    const stats = { ...r.stats, [stat]: newVal };
    if (stat === 'stamina') stats.maxHealth = stats.stamina * 10;
    updateRooster(roosterId, { stats });
    // %20 keşif şansı
    const hidden = r.discovered;
    const undiscovered = ['critChanceRevealed', 'dodgeChanceRevealed', 'panicRevealed', 'lateGameRevealed', 'potentialRevealed'].filter(k => !hidden[k]);
    let msg = `🏋️ ${stat === 'power' ? 'Güç' : stat === 'speed' ? 'Hız' : 'Dayanıklılık'} +${newVal - r.stats[stat]} `;
    if (undiscovered.length && Math.random() < 0.2) {
      const key = undiscovered[Math.floor(Math.random() * undiscovered.length)];
      hidden[key] = true;
      updateRooster(roosterId, { discovered: hidden });
      msg += '· 🔍 Gizli özellik keşfedildi!';
    }
    toast(msg);
  };

  const vet = (roosterId) => {
    if (!spendCoins(500)) return toast('⚠️ Yeterli coin yok (500 🪙)');
    const r = state.roosters.find(x => x.id === roosterId);
    updateRooster(roosterId, {
      discovered: { critChanceRevealed: true, dodgeChanceRevealed: true, panicRevealed: true, lateGameRevealed: true, potentialRevealed: true },
    });
    toast('🔬 Veteriner raporu alındı — tüm gizli özellikler açıldı!');
  };

  const doRemove = (id) => { removeRooster(id); setSelected(null); toast('🗑️ Horoz serbest bırakıldı'); };

  return (
    <div>
      <h1>🐓 Horozlarım <span className="muted" style={{ fontSize: 14 }}>({state.roosters.length})</span></h1>
      <div className="mb" style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => setShowNew(true)}>🐣 Yeni Horoz Üret</button>
      </div>

      {state.roosters.length === 0 ? (
        <div className="glass center">
          <p>Henüz horozun yok. Hemen bir horoz üret!</p>
          <button className="btn btn-gold" onClick={() => setShowNew(true)}>🐣 Horoz Üret</button>
        </div>
      ) : (
        <div className="grid grid-roosters">
          {state.roosters.map(r => <RoosterCard key={r.id} rooster={r} onClick={() => setSelected(r)} />)}
        </div>
      )}

      {selected && (
        <RoosterDetail rooster={selected} onClose={() => setSelected(null)}>
          <button className="btn btn-green btn-block" onClick={() => setShowTrain(true)}>🏋️ Antrenman Yap (🪙100 + ⚡10)</button>
          <button className="btn btn-purple btn-block" onClick={() => vet(selected.id)}>🔬 Veteriner (🪙500)</button>
          <button className="btn btn-secondary btn-block" onClick={() => { setSelected(null); doRemove(selected.id); }}>🗑️ Serbest Bırak</button>
        </RoosterDetail>
      )}

      {showTrain && selected && (
        <Modal title={`🏋️ Antrenman — ${selected.name}`} onClose={() => setShowTrain(false)}>
          <p className="muted" style={{ fontSize: 13 }}>Maliyet: 🪙100 + ⚡10 enerji. Potansiyel sınırı: {selected.stats.potential}</p>
          {['power', 'speed', 'stamina'].map(s => (
            <button key={s} className="btn btn-secondary btn-block mb" onClick={() => { train(selected.id, s); }}>
              {s === 'power' ? '⚔️ Güç' : s === 'speed' ? '💨 Hız' : '🛡️ Dayanıklılık'} (şu an: {selected.stats[s]})
            </button>
          ))}
          <button className="btn btn-secondary btn-block" onClick={() => setShowTrain(false)}>Kapat</button>
        </Modal>
      )}

      {showNew && (
        <Modal title="🐣 Yeni Horoz Üret" onClose={() => setShowNew(false)}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Horoz ismi (opsiyonel)"
            style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: '#1a1a2e', color: '#fff', marginBottom: 12 }}
          />
          <div className="muted mb" style={{ fontSize: 12 }}>Genetik seed'den benzersiz bir horoz üretilecek: ırk, element ve nadirlik rastgele belirlenecek.</div>
          <button className="btn btn-gold btn-block" onClick={addRooster}>🐣 Üret</button>
        </Modal>
      )}
    </div>
  );
}
