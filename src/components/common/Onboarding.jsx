import { useState } from 'react';
import { completeOnboarding } from '../../store/gameStore.js';
import { audio } from '../../managers/AudioManager.js';
import { vibrate } from '../../utils/vibrate.js';

const STEPS = [
  { icon: '🐣', title: 'Horoz Üret', desc: 'Genetik seed ile benzersiz horozlar üret. Her horozun ırkı, elementi ve nadirliği farklı!' },
  { icon: '🏋️', title: 'Antrenman Yap', desc: 'Güç, hız ve dayanıklılığını geliştir. Dövüşte gizli özellikler de keşfedilir.' },
  { icon: '⚔️', title: 'Arenada Dövüş', desc: 'Liglerde dövüş, coin ve prestij kazan. Bahis yaparak daha da kazanabilirsin!' },
  { icon: '🏰', title: 'Klan & Prestij', desc: 'Klan kur veya katıl, prestij sıfırlayarak yadigar kazan, imparatorluğunu büyüt!' },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  const next = () => {
    audio.click();
    vibrate('light');
    if (step < STEPS.length - 1) setStep(step + 1);
    else { completeOnboarding(); onDone(); }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal center">
        <div style={{ fontSize: 72, marginBottom: 10 }}>{s.icon}</div>
        <h1 style={{ margin: '0 0 8px' }}>{s.title}</h1>
        <p className="muted" style={{ minHeight: 48 }}>{s.desc}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '16px 0' }}>
          {STEPS.map((_, i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === step ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>← Geri</button>}
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={next}>
            {step < STEPS.length - 1 ? 'Devam →' : '🐓 Başla!'}
          </button>
        </div>
      </div>
    </div>
  );
}
