import { useState } from 'react';
import { useGame } from '../hooks/useGame.js';
import RoosterCanvas from '../components/rooster/RoosterCanvas.jsx';
import { RarityBadge, ElementIcon } from '../components/common/Badges.jsx';
import Modal from '../components/common/Modal.jsx';
import { spendCoins, generateRooster } from '../store/gameStore.js';
import { useToast } from '../components/common/Toast.jsx';
import { GeneticsEngine, RARITY } from '../engine/GeneticsEngine.js';
import EquipmentShop from '../components/market/EquipmentShop.jsx';
import { audio } from '../managers/AudioManager.js';
import { vibrate } from '../utils/vibrate.js';

const RARITY_MULT = { COMMON: 1, RARE: 2, EPIC: 4, LEGENDARY: 10 };

function createListings() {
  return Array.from({ length: 6 }, (_, i) => {
    const r = GeneticsEngine.createRooster(['Çelik','Fırtına','Ceylan','Kartal','Prens','Zorba'][i]);
    const total = GeneticsEngine.totalStats(r);
    const price = Math.max(150, Math.floor((total * 5) * (RARITY_MULT[r.rarity] || 1)));
    return { id: r.id, rooster: r, price };
  });
}

export default function MarketPage() {
  const state = useGame();
  const toast = useToast();
  const [listings, setListings] = useState(createListings);
  const [buying, setBuying] = useState(null);
  const [tab, setTab] = useState('roosters');

  const refresh = () => { setListings(createListings()); toast('🔄 Pazar yenilendi'); };

  const buy = () => {
    if (!buying) return;
    if (state.coins < buying.price) return toast('⚠️ Yeterli coin yok');
    if (!spendCoins(buying.price)) return;
    generateRooster(buying.rooster.name);
    setListings(l => l.filter(x => x.id !== buying.id));
    setBuying(null);
    audio.coin(); vibrate('success');
    toast(`🛒 ${buying.rooster.name} satın alındı!`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🛒 Pazar</h1>
        {tab === 'roosters' && <button className="btn btn-sm btn-secondary" onClick={refresh}>🔄 Yenile</button>}
      </div>

      <div className="seg mb">
        <button className={tab === 'roosters' ? 'active' : ''} onClick={() => setTab('roosters')}>🐓 Horozlar</button>
        <button className={tab === 'equipment' ? 'active' : ''} onClick={() => setTab('equipment')}>🛡️ Ekipman</button>
      </div>

      {tab === 'equipment' ? (
        <EquipmentShop state={state} ownedIds={state.equipment.map(i => i.id)} />
      ) : (
        <>
      <p className="muted mb" style={{ fontSize: 13 }}>NPC çiftçilerden horoz satın al. 6 saatte bir pazar yenilenir.</p>

      <div className="grid grid-roosters">
        {listings.map(l => (
          <div key={l.id} className={`card rooster-card rarity-glow-${l.rooster.rarity}`} onClick={() => setBuying(l)}>
            <div className="center"><RoosterCanvas rooster={l.rooster} size={95} animated /></div>
            <div className="center" style={{ fontWeight: 700 }}>{l.rooster.name}</div>
            <div className="center" style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '4px 0' }}>
              <RarityBadge rarity={l.rooster.rarity} /> <ElementIcon element={l.rooster.element} />
            </div>
            <div className="muted center" style={{ fontSize: 11 }}>Toplam {GeneticsEngine.totalStats(l.rooster)}</div>
            <div className="center" style={{ fontWeight: 800, color: 'var(--accent-yellow)', marginTop: 4 }}>🪙 {l.price}</div>
          </div>
        ))}
      </div>
      </>
      )}

      {buying && (
        <Modal title="Satın Al" onClose={() => setBuying(null)}>
          <div className="center">
            <RoosterCanvas rooster={buying.rooster} size={120} animated />
            <h2 style={{ margin: '8px 0 4px' }}>{buying.rooster.name}</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <RarityBadge rarity={buying.rooster.rarity} /> <ElementIcon element={buying.rooster.element} />
            </div>
            <div className="glass mt" style={{ textAlign: 'left', fontSize: 13 }}>
              <div>⚔️ Güç: {buying.rooster.stats.power}</div>
              <div>💨 Hız: {buying.rooster.stats.speed}</div>
              <div>🛡️ Dayanıklılık: {buying.rooster.stats.stamina}</div>
              <div>❤️ Can: {buying.rooster.stats.maxHealth}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-yellow)', margin: '10px 0' }}>🪙 {buying.price}</div>
            <button className="btn btn-gold btn-block" onClick={buy} disabled={state.coins < buying.price}>
              {state.coins < buying.price ? 'Yetersiz Bakiye' : '🛒 Satın Al'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
