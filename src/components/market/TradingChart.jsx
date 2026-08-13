import { useEffect, useRef } from 'react';
import { chartPoints } from '../../engine/TradingEngine.js';

export default function TradingChart({ history, width = 260, height = 80 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (!history || history.length < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Veri yok', width / 2, height / 2);
      return;
    }

    const pts = chartPoints(history, width, height);
    const up = history[history.length - 1].price >= history[0].price;
    const color = up ? '#22c55e' : '#ef4444';

    // Alan dolgusu
    ctx.beginPath();
    ctx.moveTo(pts[0].x, height);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, up ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Çizgi
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Son nokta
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [history, width, height]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
}
