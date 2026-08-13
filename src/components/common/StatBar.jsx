export default function StatBar({ label, value, max = 100, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="stat-row">
      <div className="stat-label">
        <span>{label}</span>
        <b>{value}{max ? ` / ${max}` : ''}</b>
      </div>
      <div className="stat-bar">
        <div className="stat-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
