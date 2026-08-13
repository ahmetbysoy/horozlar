import { useRef, useState, useEffect } from 'react';
import RoosterCanvas from '../rooster/RoosterCanvas.jsx';
import { CombatEngine } from '../../engine/CombatEngine.js';
import { audio } from '../../managers/AudioManager.js';
import { vibrate } from '../../utils/vibrate.js';

export default function FightScene({ playerRooster, enemyRooster, auto, onFinish, reward }) {
  const engineRef = useRef(null);
  const [engine, setEngine] = useState(null);
  const [round, setRound] = useState(0);
  const [log, setLog] = useState([]);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [rhythm, setRhythm] = useState(null);
  const [floats, setFloats] = useState([]);
  const [p1hp, setP1hp] = useState(playerRooster.stats.maxHealth);
  const [p2hp, setP2hp] = useState(enemyRooster.stats.maxHealth);
  const [rage, setRage] = useState(0);
  const [shake, setShake] = useState(false);
  const [showVS, setShowVS] = useState(true);
  const arenaRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => setShowVS(false), 1150); return () => clearTimeout(t); }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  useEffect(() => {
    audio.init();
    audio.roar();
    vibrate('medium');
    const e = new CombatEngine(
      { ...playerRooster, isPlayer: true },
      { ...enemyRooster, isPlayer: false },
      { maxRounds: 10 }
    );
    engineRef.current = e;
    setEngine(e);
    setP1hp(playerRooster.stats.maxHealth);
    setP2hp(enemyRooster.stats.maxHealth);
    setLog([]);
    setFinished(false);
    setResult(null);
    setRound(0);
    setRage(0);
  }, [playerRooster, enemyRooster]);

  const pushFloat = (f) => setFloats(prev => [...prev, { id: Math.random(), ...f }]);
  useEffect(() => { const t = setInterval(() => setFloats(prev => prev.filter(x => Date.now() - x.at < 1000)), 200); return () => clearInterval(t); }, []);

  const runRound = (skillId = null, rhythmMult = 1.0) => {
    const e = engineRef.current;
    if (!e || e.isFinished) return;
    const roundLog = e.simulateRound(skillId, rhythmMult);
    if (!roundLog) return;

    setP1hp(e.fighter1.currentHealth);
    setP2hp(e.fighter2.currentHealth);
    setRage(e.fighter1.rageMeter);

    const lines = [];
    roundLog.actions.forEach(a => {
      if (a.type === 'POISON_TICK') lines.push(`<p class="poison">☠️ ${a.target} zehir hasarı -${a.damage}</p>`);
      else if (a.type === 'SKILL') {
        lines.push(`<p class="skill">✨ ${a.message}</p>`);
        audio.skill(); vibrate('light');
      }
      else {
        const cls = a.isCrit ? 'crit' : a.isDodged ? 'dodge' : '';
        if (a.isCrit) {
          pushFloat({ at: Date.now(), text: `💥${a.damage}`, crit: true, attacker: a.attacker });
          audio.crit(); vibrate('heavy'); triggerShake();
        } else if (a.isDodged) {
          pushFloat({ at: Date.now(), text: 'MISS!', dodge: true, attacker: a.attacker });
          audio.dodge(); vibrate('light');
        } else {
          pushFloat({ at: Date.now(), text: `-${a.damage}`, attacker: a.attacker });
          audio.hit(); vibrate('light');
        }
        lines.push(`<p class="${cls}">⚔️ ${a.attacker} → ${a.isDodged ? 'kaçındı!' : (a.isCrit ? `KRİTİK ${a.damage}` : `${a.damage}`)}</p>`);
      }
    });
    setLog(prev => [...prev, { round: roundLog.round, html: lines.join('') }]);
    setRound(roundLog.round);

    if (e.isFinished) {
      setFinished(true);
      setResult({ winner: e.winner.isPlayer, engine: e });
      if (e.winner.isPlayer) { audio.win(); vibrate('success'); } else { audio.lose(); vibrate('error'); }
      setTimeout(() => onFinish({ win: e.winner.isPlayer, engine: e, enemyRooster }), 900);
    }
  };

  const useSkill = (skillId) => {
    const e = engineRef.current;
    if (!e || e.isFinished) return;
    const skill = e.fighter1.skills.find(s => s.id === skillId);
    if (skill && skill.currentCooldown > 0) return;
    runRound(skillId);
  };

  // Otomatik dövüş
  useEffect(() => {
    if (!auto) return;
    const e = engineRef.current;
    if (!e) return;
    const iv = setInterval(() => {
      if (e.isFinished) { clearInterval(iv); return; }
      runRound();
    }, 700);
    return () => clearInterval(iv);
  }, [auto, engine]);

  if (!engine) return null;

  const fighter = engine.fighter1;
  const enemy = engine.fighter2;

  return (
    <div>
      {/* Savaş alanı */}
      <div className={`fight-area mb ${shake ? 'animate-shake' : ''}`} ref={arenaRef}>
        {showVS && <div className="vs-splash">⚔️ VS ⚔️</div>}
        <div className="fighter p1" style={{ textAlign: 'center' }}>
          <RoosterCanvas rooster={playerRooster} size={92} animated />
          <div style={{ fontSize: 12, fontWeight: 700 }}>{playerRooster.name}</div>
        </div>
        <div className="fighter p2" style={{ textAlign: 'center' }}>
          <RoosterCanvas rooster={enemyRooster} size={92} animated />
          <div style={{ fontSize: 12, fontWeight: 700 }}>{enemyRooster.name}</div>
        </div>
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8 }}>
          <MiniHP label="BEN" hp={p1hp} max={playerRooster.stats.maxHealth} color="#ef4444" />
          <MiniHP label="RAKİP" hp={p2hp} max={enemyRooster.stats.maxHealth} color="#3b82f6" />
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: 15, textShadow: '0 1px 4px #000' }}>
          Round {round} / 10
        </div>
        {/* Damage floats */}
        {floats.map(f => (
          <div key={f.id} className={`damage-float ${f.crit ? 'crit' : f.dodge ? 'dodge' : ''}`}
            style={{ top: 40 + Math.random() * 30, left: f.attacker === playerRooster.name ? '12%' : '62%' }}>{f.text}</div>
        ))}
      </div>

      {/* Rage bar */}
      <div className="mb">
        <div className="stat-label"><span>🔥 Rage Metre</span><b>%{Math.floor(rage)}</b></div>
        <div className="stat-bar"><div className="stat-fill" style={{ width: `${rage}%`, background: 'linear-gradient(90deg,#f97316,#ef4444)' }} /></div>
      </div>

      {/* Yetenekler */}
      {!finished && (
        <div className="mb" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {fighter.skills.map(s => (
            <button key={s.id} className="btn btn-purple btn-sm"
              disabled={s.currentCooldown > 0}
              onClick={() => useSkill(s.id)}>
              {s.name} {s.currentCooldown > 0 ? `(${s.currentCooldown})` : ''}
            </button>
          ))}
          <button className="btn btn-gold btn-sm" onClick={() => runRound()} style={{ gridColumn: '1 / -1' }}>
            {auto ? '⏭️ Hızlandır' : '⚔️ Normal Saldırı'}
          </button>
          {!auto && <button className="btn btn-secondary btn-sm" style={{ gridColumn: '1 / -1' }} onClick={() => onFinish({ win: false, engine, enemyRooster })}>🚪 Çık</button>}
        </div>
      )}

      {finished && (
        <button className="btn btn-primary btn-block" onClick={() => onFinish(result)}>Devam →</button>
      )}

      {/* Log */}
      <div className="glass">
        <div className="log">
          {log.map(l => (
            <div key={l.round}>
              <p style={{ fontWeight: 800, color: 'var(--accent-yellow)' }}>— Round {l.round} —</p>
              <div dangerouslySetInnerHTML={{ __html: l.html }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniHP({ label, hp, max, color }) {
  const pct = Math.max(0, (hp / max) * 100);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px #000' }}>
        <span>{label}</span><span>{hp}/{max}</span>
      </div>
      <div className="stat-bar"><div className="stat-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}
