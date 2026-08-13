import { useRef, useState, useEffect } from 'react';
import { WHEEL_SEGMENTS, WHEEL_COLORS } from '../../store/gameStore.js';
import { audio } from '../../managers/AudioManager.js';
import { vibrate } from '../../utils/vibrate.js';

const SIZE = 280;

// doSpin: parent'ın çevirme fonksiyonu — { ok, seg, rooster?, msg? } döndürür
// onResult: animasyon sonunda çalışır
export default function SpinWheel({ doSpin, onResult }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel(ctx, rotation);
  }, [rotation]);

  function drawWheel(ctx, rot) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 10;
    const n = WHEEL_SEGMENTS.length;
    const arc = (Math.PI * 2) / n;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * arc, (i + 1) * arc);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(WHEEL_SEGMENTS[i].label, r * 0.62, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  function spin() {
    if (spinning) return;
    const result = doSpin();
    if (!result || !result.ok || !result.seg) return;
    const seg = result.seg;
    const segIndex = WHEEL_SEGMENTS.indexOf(seg);
    const arc = 360 / WHEEL_SEGMENTS.length;
    const current = rotation % 360;
    const targetAngle = segIndex * arc + arc / 2;
    const spins = 4 + Math.random() * 3;
    const total = 360 * spins + ((360 - ((current + targetAngle) % 360)) % 360);
    const newRot = rotation + total;

    setSpinning(true);
    audio.click();

    canvasRef.current.style.transition = `transform 3.2s cubic-bezier(0.15, 0.9, 0.25, 1)`;
    canvasRef.current.style.transform = `rotate(${newRot}deg)`;
    setRotation(newRot);

    setTimeout(() => {
      canvasRef.current.style.transition = '';
      setSpinning(false);
      audio.win();
      vibrate('success');
      onResult?.(result);
    }, 3300);
  }

  return (
    <div className="center">
      <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto' }}>
        <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', zIndex: 5, fontSize: 28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}>🔻</div>
        <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} />
      </div>
      <button className="btn btn-primary btn-block mt" onClick={spin} disabled={spinning}>
        {spinning ? '🎰 Çevriliyor...' : '🎰 Çevir!'}
      </button>
    </div>
  );
}
