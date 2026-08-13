const TABS = [
  { id: 'home', label: 'Sokak', icon: '🏠' },
  { id: 'roosters', label: 'Kümes', icon: '🐓' },
  { id: 'combat', label: 'Meydan', icon: '⚔️' },
  { id: 'clan', label: 'Tayfa', icon: '🏰' },
  { id: 'market', label: 'Karaborsa', icon: '🛒' },
  { id: 'quests', label: 'İşler', icon: '📋' },
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
