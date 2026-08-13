import RoosterCanvas from './RoosterCanvas.jsx';
import { RarityBadge, ElementIcon } from '../common/Badges.jsx';
import { GeneticsEngine } from '../../engine/GeneticsEngine.js';

export default function RoosterCard({ rooster, onClick }) {
  const total = GeneticsEngine.totalStats(rooster);
  return (
    <div className={`card rooster-card rarity-glow-${rooster.rarity}`} onClick={onClick}>
      <div className="center" style={{ position: 'relative' }}>
        <RoosterCanvas rooster={rooster} size={110} animated={rooster.genetics?.isMutated} />
        {rooster.genetics?.isMutated && <div style={{ position: 'absolute', top: 4, right: 8, fontSize: 18 }}>🧬</div>}
      </div>
      <div className="center" style={{ fontWeight: 800, marginBottom: 4 }}>{rooster.name}</div>
      <div className="center" style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <RarityBadge rarity={rooster.rarity} />
        <ElementIcon element={rooster.element} />
      </div>
      <div className="muted center" style={{ fontSize: 12 }}>
        Güç {rooster.stats.power} · Hız {rooster.stats.speed} · Day. {rooster.stats.stamina}
      </div>
      <div className="muted center" style={{ fontSize: 11 }}>Toplam {total} · Sv {rooster.level}</div>
    </div>
  );
}
