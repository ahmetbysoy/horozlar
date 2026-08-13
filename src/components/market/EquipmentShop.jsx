import { useState } from 'react';
import { EQUIPMENT_ITEMS, EQUIPMENT_SLOT, rarityColor } from '../../engine/EquipmentCatalog.js';
import { buyEquipment } from '../../store/gameStore.js';
import { useToast } from '../common/Toast.jsx';
import { audio } from '../../managers/AudioManager.js';
import { vibrate } from '../../utils/vibrate.js';

export default function EquipmentShop({ state, ownedIds }) {
  const toast = useToast();
  const [filter, setFilter] = useState('ALL');

  const filtered = EQUIPMENT_ITEMS.filter(i => filter === 'ALL' || i.slot === filter);

  const buy = (item) => {
    if (ownedIds.includes(item.id)) return toast('Zaten sahipsin');
    const ok = buyEquipment(item);
    if (!ok) return toast(item.cost.diamonds ? '⚠️ Yeterli elmas yok' : '⚠️ Yeterli coin yok');
    audio.coin(); vibrate('success');
    toast(`🛡️ ${item.name} satın alındı!`);
  };

  return (
    <div>
      <div className="seg mb">
        <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>Hepsi</button>
        <button className={filter === 'BEAK' ? 'active' : ''} onClick={() => setFilter('BEAK')}>Gaga</button>
        <button className={filter === 'FEATHER' ? 'active' : ''} onClick={() => setFilter('FEATHER')}>Tüy</button>
        <button className={filter === 'CLAW' ? 'active' : ''} onClick={() => setFilter('CLAW')}>Tırnak</button>
      </div>

      {filtered.map(item => {
        const owned = ownedIds.includes(item.id);
        const slot = EQUIPMENT_SLOT[item.slot];
        const price = item.cost.diamonds ? `💎 ${item.cost.diamonds}` : `🪙 ${item.cost.coins}`;
        return (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, border: owned ? '1px solid #22c55e' : undefined }}>
            <div style={{ fontSize: 28 }}>{slot.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>
                {item.name} <span className="badge" style={{ background: `${rarityColor(item.rarity)}22`, color: rarityColor(item.rarity) }}>{item.rarity}</span>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>
                {slot.label} · <b style={{ color: 'var(--accent-green)' }}>+{item.value}</b> {slot.stat === 'power' ? 'Güç' : slot.stat === 'speed' ? 'Hız' : 'Dayanıklılık'}
              </div>
            </div>
            <button className="btn btn-sm btn-gold" onClick={() => buy(item)} disabled={owned}>
              {owned ? '✅ Sahipsin' : price}
            </button>
          </div>
        );
      })}
    </div>
  );
}
