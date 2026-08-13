// Canvas 2D ile horoz çizimi — doküman §7, ırk bazlı renkler
import { useEffect, useRef } from 'react';
import { BREED_COLORS, MUTATION_COLORS, RARITY } from '../../engine/GeneticsEngine.js';

export default function RoosterCanvas({ rooster, size = 120, animated = false }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawRooster(ctx, size, rooster);

    if (animated) {
      let frame = 0;
      const loop = () => {
        frame++;
        drawRooster(ctx, size, rooster, frame);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [rooster, size, animated]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

function drawRooster(ctx, size, rooster, frame = 0) {
  const c = BREED_COLORS[rooster.breed] || BREED_COLORS.CIVIC;
  const mutColor = rooster.genetics?.isMutated ? rooster.genetics.mutationColor : null;
  const bodyColor = mutColor || c.body;
  const rarity = RARITY[rooster.rarity];

  // Rarity glow
  if (rarity.color) {
    ctx.save();
    ctx.shadowColor = rarity.color;
    ctx.shadowBlur = frame ? 14 + Math.sin(frame / 8) * 6 : 14;
    ctx.strokeStyle = rarity.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const cx = size / 2, cy = size / 2 + 4;
  const bob = frame ? Math.sin(frame / 10) * 2 : 0;

  // Vücut
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy + bob, size * 0.28, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Kanat
  ctx.fillStyle = shade(bodyColor, -20);
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.14, cy + bob + 2, size * 0.16, size * 0.12, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Kuyruk
  ctx.fillStyle = shade(bodyColor, 15);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.22, cy + bob + 2);
  ctx.quadraticCurveTo(cx - size * 0.34, cy + bob - 4, cx - size * 0.38, cy + bob - size * 0.12);
  ctx.lineTo(cx - size * 0.26, cy + bob + 4);
  ctx.fill();

  // Kafa
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(cx + size * 0.18, cy + bob - size * 0.12, size * 0.13, 0, Math.PI * 2);
  ctx.fill();

  // İbik
  ctx.fillStyle = c.comb;
  ctx.beginPath();
  ctx.arc(cx + size * 0.24, cy + bob - size * 0.22, size * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + size * 0.17, cy + bob - size * 0.23, size * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Gaga
  ctx.fillStyle = c.beak;
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.29, cy + bob - size * 0.12);
  ctx.lineTo(cx + size * 0.38, cy + bob - size * 0.10);
  ctx.lineTo(cx + size * 0.29, cy + bob - size * 0.07);
  ctx.closePath();
  ctx.fill();

  // Göz
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx + size * 0.2, cy + bob - size * 0.14, size * 0.032, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx + size * 0.205, cy + bob - size * 0.14, size * 0.015, 0, Math.PI * 2);
  ctx.fill();

  // Bacaklar
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy + bob + size * 0.24);
  ctx.lineTo(cx - 8, cy + bob + size * 0.34);
  ctx.moveTo(cx + 6, cy + bob + size * 0.24);
  ctx.lineTo(cx + 8, cy + bob + size * 0.34);
  ctx.stroke();
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}
