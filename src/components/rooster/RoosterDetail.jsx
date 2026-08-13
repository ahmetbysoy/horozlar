import Modal from '../common/Modal.jsx';
import RoosterCanvas from './RoosterCanvas.jsx';
import StatBar from '../common/StatBar.jsx';
import { RarityBadge, BreedBadge, ElementIcon, statColors } from '../common/Badges.jsx';
import { EQUIPMENT_SLOT, getEquipmentById, rarityColor } from '../../engine/EquipmentCatalog.js';

const SLOT_ORDER = ['BEAK', 'FEATHER', 'CLAW'];

export default function RoosterDetail({ rooster, onClose, inventory, onEquip, onUnequip, children }) {
  if (!rooster) return null;
  const h = rooster.hiddenStats;
  const d = rooster.discovered;
  return (
    <Modal title={rooster.name} onClose={onClose}>
      <div className="center">
        <RoosterCanvas rooster={rooster} size={140} animated={rooster.genetics?.isMutated} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', margin: '6px 0' }}>
          <RarityBadge rarity={rooster.rarity} />
          <BreedBadge breed={rooster.breed} />
          <ElementIcon element={rooster.element} />
          {rooster.genetics?.isMutated && <span className="badge" style={{ background: '#a855f722', color: '#a855f7' }}>🧬 Mutant</span>}
        </div>
        <div className="muted" style={{ fontSize: 12 }}>Seviye {rooster.level} · Nesil {rooster.genetics?.generation} · Seed: <code>{rooster.seed}</code></div>
      </div>

      <div className="mt">
        <StatBar label="⚔️ Güç" value={rooster.stats.power} color={statColors.power} />
        <StatBar label="💨 Hız" value={rooster.stats.speed} color={statColors.speed} />
        <StatBar label="🛡️ Dayanıklılık" value={rooster.stats.stamina} color={statColors.stamina} />
        <StatBar label="❤️ Can" value={rooster.stats.maxHealth} color="#ef4444" />
      </div>

      <div className="glass mt">
        <h2 style={{ fontSize: 15 }}>Gizli Özellikler</h2>
        <HiddenRow label="Kritik Şansı" value={pct(h.critChance)} revealed={d.critChanceRevealed} />
        <HiddenRow label="Kaçınma Şansı" value={pct(h.dodgeChance)} revealed={d.dodgeChanceRevealed} />
        <HiddenRow label="Panik Eşiği" value={pct(h.panicThreshold)} revealed={d.panicRevealed} />
        <HiddenRow label="Geç Oyun Gücü" value={h.lateGamePower} revealed={d.lateGameRevealed} />
        <HiddenRow label="Maks. Potansiyel" value={h.maxPotential} revealed={d.potentialRevealed} />
        <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>💡 Veteriner (🪙500) ile gizli özellikler açılır veya dövüş sonrası %30 şansla keşfedilir.</div>
      </div>

      <div className="glass mt">
        <h2 style={{ fontSize: 15 }}>Yetenekler</h2>
        {rooster.skills.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
            <span><b>{s.name}</b> <span className="muted">({s.description})</span></span>
            <span className="muted">CD {s.cooldown}</span>
          </div>
        ))}
      </div>

      <div className="glass mt">
        <h2 style={{ fontSize: 15 }}>Dövüş İstatistikleri</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 13 }}>
          <span>Dövüş: <b>{rooster.battleStats.fights}</b></span>
          <span>Galibiyet: <b>{rooster.battleStats.wins}</b></span>
          <span>Mağlubiyet: <b>{rooster.battleStats.losses}</b></span>
          <span>Öldürme: <b>{rooster.battleStats.kills}</b></span>
        </div>
      </div>

      <div className="glass mt">
        <h2 style={{ fontSize: 15 }}>🛡️ Ekipman</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
          {SLOT_ORDER.map(slotKey => {
            const slot = EQUIPMENT_SLOT[slotKey];
            const itemId = rooster.equipment && rooster.equipment[slotKey.toLowerCase()];
            const item = itemId ? getEquipmentById(itemId) : null;
            return (
              <div key={slotKey} style={{ textAlign: 'center', padding: 8, borderRadius: 10, background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: 22 }}>{slot.icon}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{slot.label}</div>
                {item ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent-green)' }}>+{item.value}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Boş</div>
                )}
              </div>
            );
          })}
        </div>
        {inventory && inventory.length > 0 && (
          <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inventory.map(item => {
              const equippedHere = item.equippedTo === rooster.id;
              const equippedElse = item.equippedTo && item.equippedTo !== rooster.id;
              const slot = EQUIPMENT_SLOT[item.slot];
              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: 13 }}>
                    {slot.icon} {item.name} <span className="badge" style={{ background: `${rarityColor(item.rarity)}22`, color: rarityColor(item.rarity) }}>+{item.value}</span>
                  </div>
                  {equippedHere ? (
                    <button className="btn btn-sm btn-secondary" onClick={() => onUnequip(item.id, rooster.id)}>Çıkar</button>
                  ) : (
                    <button className="btn btn-sm btn-purple" disabled={equippedElse} onClick={() => onEquip(item.id, rooster.id)}>
                      {equippedElse ? 'Başka horozda' : 'Tak'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {(!inventory || inventory.length === 0) && <div className="muted" style={{ fontSize: 12 }}>Envanterde ekipman yok. Pazar → Ekipman'dan satın al.</div>}
      </div>

      {children && <div className="mt" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>}
    </Modal>
  );
}

function HiddenRow({ label, value, revealed }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 13 }}>
      <span className="muted">{label}</span>
      <b>{revealed ? value : '❓ ???'}</b>
    </div>
  );
}

function pct(x) { return (x * 100).toFixed(0) + '%'; }
