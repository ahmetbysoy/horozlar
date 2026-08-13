export default function TopBar({ state }) {
  return (
    <div className="topbar">
      <div className="brand">🐓 Horoz<span>İmp</span></div>
      <div className="resources">
        <span className="res coin">🪙 {fmt(state.coins)}</span>
        <span className="res diamond">💎 {state.diamonds}</span>
        <span className="res energy">⚡ {state.energy}/{state.energyMax}</span>
      </div>
    </div>
  );
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
}
