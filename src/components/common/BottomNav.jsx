const TABS = [
  { id: 'home', label: 'Ana', icon: '🏠' },
  { id: 'roosters', label: 'Horozlar', icon: '🐓' },
  { id: 'combat', label: 'Dövüş', icon: '⚔️' },
  { id: 'market', label: 'Pazar', icon: '🛒' },
  { id: 'quests', label: 'Görevler', icon: '📋' },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottomnav">
      {TABS.map(t => (
        <button key={t.id} className={`nav-item ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          <span className="icon">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
