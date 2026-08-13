import { RARITY, BREED_LABEL, ELEMENT_LABEL } from '../../engine/GeneticsEngine.js';

export function RarityBadge({ rarity }) {
  const r = RARITY[rarity] || RARITY.COMMON;
  return <span className="badge" style={{ background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}55` }}>{rarity} · {r.label}</span>;
}

export function ElementIcon({ element, size = 18 }) {
  const map = { FIRE: '🔥', WATER: '💧', NATURE: '🌿' };
  return <span style={{ fontSize: size }}>{map[element]}</span>;
}

export function BreedBadge({ breed }) {
  return <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>{BREED_LABEL[breed] || breed}</span>;
}

export const elementColor = {
  FIRE: 'var(--accent-red)', WATER: 'var(--accent-blue)', NATURE: 'var(--accent-green)',
};
export const statColors = { power: '#ef4444', speed: '#3b82f6', stamina: '#22c55e' };
